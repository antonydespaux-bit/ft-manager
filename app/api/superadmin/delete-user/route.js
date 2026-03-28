import { z } from 'zod'
import { supabaseServiceRole, requireSuperAdmin } from '../../../../lib/apiGuards'

const deleteUserSchema = z.object({
  user_id: z.string().uuid()
})

export async function POST(request) {
  try {
    const gate = await requireSuperAdmin(request)
    if (gate.response) return gate.response

    const parsed = deleteUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return Response.json(
        { error: 'Payload invalide.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const userId = parsed.data.user_id

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

