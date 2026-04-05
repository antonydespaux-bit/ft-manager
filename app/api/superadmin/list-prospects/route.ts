import { apiHandler } from '../../../../lib/apiHandler'
import { z } from 'zod'

export const GET = apiHandler({
  guard: 'superadmin',
  handler: async ({ db }) => {
    const { data, error } = await db
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return Response.json({ prospects: data ?? [] })
  },
})
