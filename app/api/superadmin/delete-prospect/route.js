import { supabaseServiceRole, requireSuperAdmin } from '../../../../lib/apiGuards'

export async function DELETE(request) {
  try {
    const gate = await requireSuperAdmin(request)
    if (gate.response) return gate.response

    const { id } = await request.json()

    const { error } = await supabaseServiceRole
      .from('prospects')
      .delete()
      .eq('id', id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
