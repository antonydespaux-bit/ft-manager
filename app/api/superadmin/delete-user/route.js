import { createClient } from '@supabase/supabase-js'
import { isSuperadminEmail } from '../../../../lib/superadmin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)


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

export async function POST(request) {
  try {
    const gate = await requireSuperAdmin(request)
    if (gate.response) return gate.response

    const body = await request.json()
    const userId = typeof body.user_id === 'string' ? body.user_id.trim() : ''

    if (!userId) {
      return Response.json({ error: 'Paramètre user_id manquant.' }, { status: 400 })
    }

    if (userId === gate.user.id) {
      return Response.json({ error: 'Vous ne pouvez pas vous supprimer vous-même.' }, { status: 400 })
    }

    const { error: errAcces } = await supabaseServiceRole
      .from('acces_clients')
      .delete()
      .eq('user_id', userId)
    if (errAcces) {
      return Response.json({ error: errAcces.message || 'Erreur suppression accès.' }, { status: 400 })
    }

    const { error: errProfil } = await supabaseServiceRole
      .from('profils')
      .delete()
      .eq('id', userId)
    if (errProfil) {
      return Response.json({ error: errProfil.message || 'Erreur suppression profil.' }, { status: 400 })
    }

    const { error: errAuth } = await supabaseServiceRole.auth.admin.deleteUser(userId)
    if (errAuth) {
      return Response.json(
        { error: errAuth.message || 'Erreur suppression compte Auth.' },
        { status: 400 }
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

