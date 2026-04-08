/**
 * Superadmin email management.
 *
 * V2 Security: No more hardcoded emails. Superadmin emails MUST be configured
 * via the SUPERADMIN_EMAILS environment variable. If not set, no one gets
 * superadmin access (fail-closed security model).
 *
 * Set in Vercel / .env.local:
 *   SUPERADMIN_EMAILS=antony.despaux@hotmail.fr,antony@skalcook.com
 */

function parseEmails(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getSuperadminEmails() {
  const raw = typeof window === 'undefined'
    ? (process.env.SUPERADMIN_EMAILS || process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS || '')
    : (process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS || '')

  const parsed = parseEmails(raw)

  if (parsed.length === 0) {
    console.warn(
      '[SECURITY] SUPERADMIN_EMAILS env var not set. No superadmin access granted. ' +
      'Set SUPERADMIN_EMAILS in your environment to configure superadmin users.'
    )
  }

  return parsed
}

export function isSuperadminEmail(email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return false
  return getSuperadminEmails().includes(normalized)
}
