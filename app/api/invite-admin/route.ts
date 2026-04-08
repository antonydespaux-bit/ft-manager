import { apiHandler } from '../../../lib/apiHandler'
import { inviteAdminSchema } from '../../../lib/validators/admin.schema'
import { inviteAdmin } from '../../../lib/services/admin.service'

export const POST = apiHandler({
  schema: inviteAdminSchema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.client_id',
  handler: async ({ data, db }) => {
    const result = await inviteAdmin(db, data.email, data.nom_complet, data.client_id)
    return Response.json(result, { status: 201 })
  },
})
