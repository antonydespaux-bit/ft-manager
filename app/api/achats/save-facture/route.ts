import { apiHandler } from '../../../../lib/apiHandler'
import { saveFactureSchema } from '../../../../lib/validators/achats.schema'
import { saveFacture } from '../../../../lib/services/achats.service'
import { ConflictError } from '../../../../lib/errors'

export const POST = apiHandler({
  schema: saveFactureSchema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.clientId',
  handler: async ({ data, user, db }) => {
    try {
      const result = await saveFacture(db, data, user!.id)
      return Response.json(result)
    } catch (err) {
      if (err instanceof ConflictError) {
        // Retrieve duplicate info for the frontend
        const numTrimmed = data.numeroFacture?.trim() || ''
        const { data: rows } = await db
          .from('achats_factures')
          .select('id, date_facture, fournisseur, total_ht, created_at')
          .eq('client_id', data.clientId)
          .ilike('numero_facture', numTrimmed)
          .limit(1)

        const existing = rows?.[0] ?? null
        return Response.json(
          { error: 'DUPLICATE_FACTURE', existing },
          { status: 409 }
        )
      }
      throw err
    }
  },
})
