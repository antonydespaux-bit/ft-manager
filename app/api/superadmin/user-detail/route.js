import { z } from 'zod'
import { supabaseServiceRole, requireSuperAdmin } from '../../../../lib/apiGuards'

const userDetailQuerySchema = z.object({
  user_id: z.string().uuid()
})

export async function GET(request) {
  try {
    const gate = await requireSuperAdmin(request)
    if (gate.response) return gate.response

    const url = new URL(request.url)
    const parsedQuery = userDetailQuerySchema.safeParse({
      user_id: url.searchParams.get('user_id')
    })
    if (!parsedQuery.success) {
      return Response.json(
        { error: 'Query invalide.', details: parsedQuery.error.flatten() },
        { status: 400 }
      )
    }
    const userId = parsedQuery.data.user_id

    const [profilRes, clientsRes, accesRes] = await Promise.all([
      supabaseServiceRole
        .from('profils')
        .select('id, nom, email, role, client_id, created_at')
        .eq('id', userId)
        .maybeSingle(),
      supabaseServiceRole
        .from('clients')
        .select('id, nom_etablissement, nom, slug, actif')
        .order('nom_etablissement', { ascending: true }),
      supabaseServiceRole
        .from('acces_clients')
        .select('client_id')
        .eq('user_id', userId)
    ])

    if (profilRes.error) {
      return Response.json({ error: profilRes.error.message || 'Erreur profil.' }, { status: 400 })
    }
    if (clientsRes.error) {
      return Response.json({ error: clientsRes.error.message || 'Erreur clients.' }, { status: 400 })
    }
    if (accesRes.error) {
      return Response.json({ error: accesRes.error.message || 'Erreur accès.' }, { status: 400 })
    }

    const fromAcces = (accesRes.data || []).map((row) => row.client_id).filter(Boolean)
    const seeded = profilRes.data?.client_id
      ? Array.from(new Set([...fromAcces, profilRes.data.client_id]))
      : fromAcces

    return Response.json({
      profil: profilRes.data || null,
      clients: clientsRes.data || [],
      selectedClientIds: seeded
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

