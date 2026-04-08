import { apiHandler } from '../../../../lib/apiHandler'
import { deleteUserSchema } from '../../../../lib/validators/admin.schema'
import { deleteUser } from '../../../../lib/services/admin.service'

export const POST = apiHandler({
  schema: deleteUserSchema,
  guard: 'superadmin',
  handler: async ({ data, user, db }) => {
    const result = await deleteUser(db, data.user_id, user!.id)
    return Response.json(result)
  },
})
