import { requireAdminOrSuperadmin, getServiceClient } from '../../../../lib/apiGuards'

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { factureId, clientId, fournisseur, numeroFacture, dateFacture, statut } = body ?? {}

    if (!factureId || !clientId) {
      return Response.json({ error: 'factureId et clientId requis.' }, { status: 400 })
    }

    const { response: authError } = await requireAdminOrSuperadmin(request, clientId)
    if (authError) return authError

    const db = getServiceClient()

    const updates = {}
    if (fournisseur   !== undefined) updates.fournisseur    = fournisseur.trim()
    if (numeroFacture !== undefined) updates.numero_facture = numeroFacture?.trim() || null
    if (dateFacture   !== undefined) updates.date_facture   = dateFacture
    if (statut        !== undefined) updates.statut         = statut

    const { error } = await db
      .from('achats_factures')
      .update(updates)
      .eq('id', factureId)
      .eq('client_id', clientId)

    if (error) throw new Error(error.message)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('update-facture error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
