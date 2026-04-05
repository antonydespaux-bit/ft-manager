import { apiHandler } from '../../../../lib/apiHandler'
import { deleteInventaireSchema } from '../../../../lib/validators/inventaire.schema'
import { deleteInventaire } from '../../../../lib/services/inventaire.service'

export const DELETE = apiHandler({
  schema: deleteInventaireSchema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.clientId',
  handler: async ({ data, db }) => {
    const result = await deleteInventaire(db, data.inventaireId, data.clientId)
    return Response.json(result)
  },
})
