import { apiHandler } from '../../../lib/apiHandler'
import { z } from 'zod'

const querySchema = z.object({
  client_id: z.string().uuid(),
})

export const GET = apiHandler({
  schema: querySchema,
  guard: 'adminOrSuperadmin',
  clientIdFrom: 'body.client_id',
  handler: async ({ data, db }) => {
    const clientId = data.client_id

    // Load all data in parallel for RGPD portability export
    const [clientRes, fichesCuisineRes, fichesBarRes, ingredientsRes, ingredientsBarRes] =
      await Promise.all([
        db.from('clients').select('*').eq('id', clientId).maybeSingle(),
        db.from('fiches').select('*').eq('client_id', clientId),
        db.from('fiches_bar').select('*').eq('client_id', clientId),
        db.from('ingredients').select('*').eq('client_id', clientId),
        db.from('ingredients_bar').select('*').eq('client_id', clientId),
      ])

    const exportData = {
      exported_at: new Date().toISOString(),
      client: clientRes.data,
      fiches_cuisine: fichesCuisineRes.data ?? [],
      fiches_bar: fichesBarRes.data ?? [],
      ingredients: ingredientsRes.data ?? [],
      ingredients_bar: ingredientsBarRes.data ?? [],
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="skalcook-export-${clientId}.json"`,
      },
    })
  },
})
