import { apiHandler } from '../../../../lib/apiHandler'
import { updateClientSchema } from '../../../../lib/validators/admin.schema'
import { updateClient } from '../../../../lib/services/admin.service'

export const POST = apiHandler({
  schema: updateClientSchema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.clientId',
  handler: async ({ data, db }) => {
    const result = await updateClient(db, data)
    return Response.json(result)
  },
})
