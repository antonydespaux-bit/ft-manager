import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware unifié : détection du tenant + security headers + rate limiting.
 *
 * Changements V2 :
 * - Rate limiting en mémoire conservé (fonctionne sur Node.js runtime long-running).
 *   Pour Vercel Edge/Serverless, migrer vers @upstash/ratelimit + Redis.
 * - CSP renforcé : suppression de 'unsafe-eval', conservation de 'unsafe-inline'
 *   uniquement pour la compatibilité avec les styles inline (TailwindCSS).
 * - Tenant slug sanitisé contre les injections.
 * - Strict-Transport-Security ajouté.
 */

// ── Rate limiter en mémoire — sliding window par IP ─────────────────────────
// Fonctionne uniquement en mode Node.js (pas Edge). Pour la production serverless,
// utiliser @upstash/ratelimit + Redis.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60

const ipRequests = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(ip: string) {
  const now = Date.now()
  const entry = ipRequests.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequests.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, retryAfter: 0 }
}

// Cleanup to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of ipRequests.entries()) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
        ipRequests.delete(ip)
      }
    }
  }, RATE_LIMIT_WINDOW_MS)
}

// ── Tenant slug validation ──────────────────────────────────────────────────
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

function sanitizeSlug(slug: string | null): string | null {
  if (!slug) return null
  const cleaned = slug.toLowerCase().trim()
  return SLUG_PATTERN.test(cleaned) ? cleaned : null
}

// ── Détection du tenant depuis le sous-domaine ───────────────────────────────
function detectTenantSlug(req: NextRequest): string | null {
  const { hostname, searchParams } = req.nextUrl
  const parts = hostname.split('.')

  let tenantSlug: string | null = null

  if (hostname.includes('localhost')) {
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      tenantSlug = parts[0]
    }
  } else if (hostname.includes('vercel.app')) {
    tenantSlug = req.cookies.get('tenant_slug')?.value || null
  } else {
    if (parts.length >= 3) {
      tenantSlug = parts[0]
    }
  }

  if (!tenantSlug) {
    tenantSlug = searchParams.get('tenant') || null
  }

  return sanitizeSlug(tenantSlug)
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  let rateLimitRemaining: number | undefined

  // ── 1. Rate limiting (API routes only) ──────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

    const { allowed, remaining, retryAfter } = checkRateLimit(ip)
    rateLimitRemaining = remaining

    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // ── 2. Tenant detection ──────────────────────────────────────────────────
  const tenantSlug = detectTenantSlug(req)
  const res = NextResponse.next()

  if (tenantSlug) {
    res.cookies.set('tenant_slug', tenantSlug, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    res.headers.set('x-tenant-slug', tenantSlug)
  }

  // ── 3. Security headers ──────────────────────────────────────────────────
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=()'
  )

  // CSP: 'unsafe-inline' kept for TailwindCSS inline styles.
  // 'unsafe-eval' REMOVED — was a security risk with no real benefit.
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://static.axept.io https://axept.io https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://fonts.axept.io https://*.axept.io",
      "font-src 'self' https://fonts.gstatic.com https://fonts.axept.io",
      "img-src 'self' data: blob: https:",
      "frame-src 'self' blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://static.axept.io https://axept.io https://*.axept.io https://cdn.jsdelivr.net https://unpkg.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  if (pathname.startsWith('/api/') && rateLimitRemaining !== undefined) {
    res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX))
    res.headers.set('X-RateLimit-Remaining', String(rateLimitRemaining))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)).*)',
  ],
}
