import { apiHandler } from '../../../../lib/apiHandler'
import { updateFactureSchema } from '../../../../lib/validators/achats.schema'
import { updateFacture } from '../../../../lib/services/achats.service'

export const PATCH = apiHandler({
  schema: updateFactureSchema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.clientId',
  handler: async ({ data, db }) => {
    const { factureId, clientId, ...updates } = data
    const result = await updateFacture(db, factureId, clientId, updates)
    return Response.json(result)
  },
})
