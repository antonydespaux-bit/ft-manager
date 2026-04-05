import { apiHandler } from '../../../../lib/apiHandler'
import { z } from 'zod'
import { listAllUsers } from '../../../../lib/services/admin.service'

const querySchema = z.object({
  role: z.string().optional(),
})

export const GET = apiHandler({
  schema: querySchema,
  guard: 'superadmin',
  handler: async ({ data, db }) => {
    const users = await listAllUsers(db, data.role)
    return Response.json({ users })
  },
})
