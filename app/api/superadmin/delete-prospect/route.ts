import { apiHandler } from '../../../../lib/apiHandler'
import { z } from 'zod'

const schema = z.object({
  id: z.string().uuid(),
})

export const DELETE = apiHandler({
  schema,
  guard: 'superadmin',
  handler: async ({ data, db }) => {
    const { error } = await db
      .from('prospects')
      .delete()
      .eq('id', data.id)

    if (error) throw new Error(error.message)
    return Response.json({ deleted: true })
  },
})
