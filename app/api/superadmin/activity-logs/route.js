import { createClient } from '@supabase/supabase-js'
import { isSuperadminEmail } from '../../../../lib/superadmin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function parseDevice(ua) {
  if (!ua) return 'Inconnu'
  if (/iPhone|iPad/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Autre'
}

function parseBrowser(ua) {
  if (!ua) return 'Inconnu'
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Autre'
}

async function requireSuperAdmin(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { response: Response.json({ error: 'Non authentifié.' }, { status: 401 }) }
  }
  const jwt = authHeader.slice(7).trim()
  if (!jwt) {
    return { response: Response.json({ error: 'Non authentifié.' }, { status: 401 }) }
  }
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser(jwt)
  if (userErr || !user) {
    return { response: Response.json({ error: 'Session invalide.' }, { status: 401 }) }
  }
  const userEmail = (user.email || '').toLowerCase().trim()
  if (isSuperadminEmail(userEmail)) return { user }

  const { data: profil, error: profilErr } = await supabaseServiceRole
    .from('profils')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (profilErr || !profil?.is_superadmin) {
    return { response: Response.json({ error: 'Accès refusé : super admin requis.' }, { status: 403 }) }
  }
  return { user }
}

export async function GET(request) {
  try {
    const gate = await requireSuperAdmin(request)
    if (gate.response) return gate.response

    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId') || ''
    const userId = url.searchParams.get('userId') || ''
    const device = url.searchParams.get('device') || ''
    const days = parseInt(url.searchParams.get('days') || '7', 10)

    const now = new Date()
    const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const yesterday24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Build base query
    let logsQuery = supabaseServiceRole
      .from('logs')
      .select('id, user_id, user_nom, action, entite, entite_nom, section, client_id, created_at, user_agent')
      .gte('created_at', dateFrom)
      .order('created_at', { ascending: false })
      .limit(500)

    if (clientId) logsQuery = logsQuery.eq('client_id', clientId)
    if (userId) logsQuery = logsQuery.eq('user_id', userId)

    const { data: logs, error: logsErr } = await logsQuery
    if (logsErr) return Response.json({ error: logsErr.message }, { status: 400 })

    // Enrich logs with device/browser info, filter by device if needed
    let enrichedLogs = (logs || []).map(log => ({
      ...log,
      device: parseDevice(log.user_agent),
      browser: parseBrowser(log.user_agent),
    }))
    if (device) enrichedLogs = enrichedLogs.filter(l => l.device === device)

    // KPIs
    const activeUsers24h = new Set(
      enrichedLogs.filter(l => l.created_at >= yesterday24h).map(l => l.user_id)
    ).size

    const modificationsToday = enrichedLogs.filter(
      l => l.action === 'MODIFICATION' && l.created_at >= today
    ).length

    // Top client by log count (last 7 days)
    const clientCounts = {}
    for (const l of enrichedLogs) {
      if (l.client_id) clientCounts[l.client_id] = (clientCounts[l.client_id] || 0) + 1
    }
    const topClientId = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Chart data: group by day for last `days` days
    const chartMap = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      chartMap[key] = 0
    }
    for (const l of enrichedLogs) {
      const d = new Date(l.created_at)
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in chartMap) chartMap[key]++
    }
    const chartData = Object.entries(chartMap).map(([date, actions]) => ({ date, actions }))

    // Recent 50 logs
    const recentLogs = enrichedLogs.slice(0, 50)

    // Load clients for filter dropdown
    const { data: clientsData } = await supabaseServiceRole
      .from('clients')
      .select('id, nom_etablissement')
      .order('nom_etablissement')

    // Distinct users from logs for filter dropdown
    const usersMap = {}
    for (const l of enrichedLogs) {
      if (l.user_id && !usersMap[l.user_id]) {
        usersMap[l.user_id] = l.user_nom
      }
    }
    const users = Object.entries(usersMap).map(([user_id, user_nom]) => ({ user_id, user_nom }))

    // Resolve top client name
    const topClient = (clientsData || []).find(c => c.id === topClientId)?.nom_etablissement || null

    return Response.json({
      kpis: { activeUsers24h, modificationsToday, topClient },
      chartData,
      recentLogs,
      clients: clientsData || [],
      users,
    })
  } catch (err) {
    console.error('activity-logs error:', err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
