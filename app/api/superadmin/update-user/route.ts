import { apiHandler } from '../../../../lib/apiHandler'
import { updateUserSchema } from '../../../../lib/validators/admin.schema'
import { updateUser } from '../../../../lib/services/admin.service'

export const POST = apiHandler({
  schema: updateUserSchema,
  guard: 'superadmin',
  handler: async ({ data, db }) => {
    const result = await updateUser(db, data)
    return Response.json(result)
  },
})
