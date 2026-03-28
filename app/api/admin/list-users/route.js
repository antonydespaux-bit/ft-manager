import { z } from 'zod'
import { supabaseServiceRole, requireAdminOrSuperadmin } from '../../../../lib/apiGuards'

const querySchema = z.object({
  client_id: z.string().uuid()
})

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const parsed = querySchema.safeParse({
      client_id: url.searchParams.get('client_id')
    })
    if (!parsed.success) {
      return Response.json(
        { error: 'Query invalide.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const clientId = parsed.data.client_id

    const gate = await requireAdminOrSuperadmin(request, clientId)
    if (gate.response) return gate.response

    const { data: accessRows, error: accessErr } = await supabaseServiceRole
      .from('acces_clients')
      .select('user_id, role, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (accessErr) {
      return Response.json({ error: accessErr.message || 'Erreur chargement accès.' }, { status: 400 })
    }

    const userIds = Array.from(new Set((accessRows || []).map((r) => r?.user_id).filter(Boolean)))
    if (userIds.length === 0) {
      return Response.json({ users: [], total: 0 })
    }

    const { data: profilsRows, error: profilsErr } = await supabaseServiceRole
      .from('profils')
      .select('id, nom, email, created_at')
      .in('id', userIds)

    if (profilsErr) {
      return Response.json({ error: profilsErr.message || 'Erreur chargement profils.' }, { status: 400 })
    }

    const profilsMap = new Map((profilsRows || []).map((p) => [p.id, p]))
    const users = (accessRows || [])
      .map((access) => {
        const profil = profilsMap.get(access.user_id)
        return {
          id: access.user_id,
          nom: profil?.nom || null,
          email: profil?.email || null,
          created_at: profil?.created_at || access.created_at || null,
          role: access.role || null
        }
      })
      .filter((row) => row.id)

    return Response.json({ users, total: users.length })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
