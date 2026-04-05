import { apiHandler } from '../../../lib/apiHandler'
import { createUserSchema } from '../../../lib/validators/admin.schema'
import { createUser } from '../../../lib/services/admin.service'

export const POST = apiHandler({
  schema: createUserSchema,
  guard: 'superadmin',
  handler: async ({ data, db }) => {
    const result = await createUser(db, data)
    return Response.json(result, { status: 201 })
  },
})
