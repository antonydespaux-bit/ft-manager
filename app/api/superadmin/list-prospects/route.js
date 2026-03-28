import { supabaseServiceRole, requireSuperAdmin } from '../../../../lib/apiGuards'

export async function GET(request) {
  try {
    const gate = await requireSuperAdmin(request)
    if (gate.response) return gate.response

    const { data, error } = await supabaseServiceRole
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return Response.json({ error: error.message || 'Erreur chargement prospects.' }, { status: 400 })
    }

    return Response.json({ prospects: data || [], total: (data || []).length })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
