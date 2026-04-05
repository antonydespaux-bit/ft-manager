import { apiHandler } from '../../../../lib/apiHandler'
import { createGlobalUserSchema } from '../../../../lib/validators/admin.schema'
import { createGlobalUser } from '../../../../lib/services/admin.service'

export const POST = apiHandler({
  schema: createGlobalUserSchema,
  guard: 'superadmin',
  handler: async ({ data, db }) => {
    const result = await createGlobalUser(db, data)
    return Response.json(result, { status: 201 })
  },
})
