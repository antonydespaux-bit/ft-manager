import { apiHandler } from '../../../../lib/apiHandler'
import { activityLogsQuerySchema } from '../../../../lib/validators/admin.schema'
import { getActivityLogs } from '../../../../lib/services/admin.service'

export const GET = apiHandler({
  schema: activityLogsQuerySchema,
  guard: 'superadmin',
  handler: async ({ data, db }) => {
    const result = await getActivityLogs(db, data)
    return Response.json(result)
  },
})
