import { apiHandler } from '../../../../lib/apiHandler'
import { deleteFactureSchema } from '../../../../lib/validators/achats.schema'
import { deleteFacture } from '../../../../lib/services/achats.service'

export const DELETE = apiHandler({
  schema: deleteFactureSchema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.clientId',
  handler: async ({ data, db }) => {
    const result = await deleteFacture(db, data.factureId, data.clientId)
    return Response.json(result)
  },
})
