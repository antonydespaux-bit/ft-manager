import { createClient } from '@supabase/supabase-js'
import { isSuperadminEmail } from '../../../../lib/superadmin'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const listUsersQuerySchema = z.object({
  role: z.string().trim().min(1).optional()
})


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
  if (isSuperadminEmail(userEmail)) {
    return { user }
  }

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
    const parsedQuery = listUsersQuerySchema.safeParse({
      role: url.searchParams.get('role') || undefined
    })
    if (!parsedQuery.success) {
      return Response.json(
        { error: 'Query invalide.', details: parsedQuery.error.flatten() },
        { status: 400 }
      )
    }

    const roleFilter = parsedQuery.data.role?.toLowerCase()

    // AUCUN filtre: on lit tous les profils.
    const [profilsRes, accesRes] = await Promise.all([
      supabaseServiceRole
        .from('profils')
        .select('id, nom, email, role, client_id, created_at, telephone, site_web, siret_personnel, adresse_pro')
        .order('created_at', { ascending: false }),
      supabaseServiceRole
        .from('acces_clients')
        .select('user_id, client_id')
    ])

    if (profilsRes.error) {
      return Response.json({ error: profilsRes.error.message || 'Erreur chargement profils.' }, { status: 400 })
    }
    if (accesRes.error) {
      return Response.json({ error: accesRes.error.message || 'Erreur chargement accès.' }, { status: 400 })
    }

    const accessMap = new Map()
    for (const row of accesRes.data || []) {
      const uid = row?.user_id
      const cid = row?.client_id
      if (!uid || !cid) continue
      if (!accessMap.has(uid)) accessMap.set(uid, new Set())
      accessMap.get(uid).add(cid)
    }

    let users = (profilsRes.data || []).map((u) => ({
      ...u,
      etablissement_count: accessMap.get(u.id)?.size || 0
    }))
    if (roleFilter) {
      users = users.filter((u) => String(u.role || '').toLowerCase() === roleFilter)
    }

    return Response.json({ users, total: users.length })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

