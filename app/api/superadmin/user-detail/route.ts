import { apiHandler } from '../../../../lib/apiHandler'
import { z } from 'zod'
import { getUserDetail } from '../../../../lib/services/admin.service'

const querySchema = z.object({
  userId: z.string().uuid(),
})

export const GET = apiHandler({
  schema: querySchema,
  guard: 'superadmin',
  handler: async ({ data, db }) => {
    const result = await getUserDetail(db, data.userId)
    return Response.json(result)
  },
})
