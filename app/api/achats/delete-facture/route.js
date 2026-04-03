import { requireAdminOrSuperadmin, getServiceClient } from '../../../../lib/apiGuards'

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const factureId = searchParams.get('factureId')
    const clientId  = searchParams.get('clientId')

    if (!factureId || !clientId) {
      return Response.json({ error: 'factureId et clientId requis.' }, { status: 400 })
    }

    const { response: authError } = await requireAdminOrSuperadmin(request, clientId)
    if (authError) return authError

    const db = getServiceClient()

    // Les lignes sont supprimées en cascade (ON DELETE CASCADE)
    const { error } = await db
      .from('achats_factures')
      .delete()
      .eq('id', factureId)
      .eq('client_id', clientId)

    if (error) throw new Error(error.message)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('delete-facture error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
