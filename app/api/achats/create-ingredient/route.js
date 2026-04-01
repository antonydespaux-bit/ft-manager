import { requireAdminOrSuperadmin, getServiceClient } from '../../../../lib/apiGuards'

export async function POST(request) {
  try {
    const body = await request.json()
    const { clientId, nom, unite, prix_kg } = body ?? {}

    if (!clientId || !nom?.trim()) {
      return Response.json({ error: 'clientId et nom sont requis.' }, { status: 400 })
    }

    const { response: authError } = await requireAdminOrSuperadmin(request, clientId)
    if (authError) return authError

    const db = getServiceClient()

    const { data: ingredient, error } = await db
      .from('ingredients')
      .insert({
        client_id:     clientId,
        nom:           nom.trim(),
        unite:         unite?.trim() || null,
        prix_kg:       prix_kg ? Number(prix_kg) : null,
        est_sous_fiche: false,
      })
      .select('id, nom, unite, prix_kg')
      .single()

    if (error) throw new Error(error.message)

    return Response.json({ ingredient })
  } catch (err) {
    console.error('create-ingredient error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
