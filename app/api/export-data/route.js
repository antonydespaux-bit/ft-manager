import { supabaseServiceRole, requireAdminOrSuperadmin } from '../../../lib/apiGuards'
import { z } from 'zod'

const schema = z.object({ client_id: z.string().uuid() })

export async function GET(request) {
  try {
    const url    = new URL(request.url)
    const parsed = schema.safeParse({ client_id: url.searchParams.get('client_id') })
    if (!parsed.success) {
      return Response.json({ error: 'Paramètre client_id invalide.' }, { status: 400 })
    }

    const { client_id } = parsed.data
    const gate = await requireAdminOrSuperadmin(request, client_id)
    if (gate.response) return gate.response

    const [
      { data: client },
      { data: fiches },
      { data: fichesBar },
      { data: ingredients },
      { data: ingredientsBar },
      { data: ficheIngredients },
      { data: ficheBarIngredients },
    ] = await Promise.all([
      supabaseServiceRole.from('clients').select('id, nom, nom_etablissement, adresse, adresse_siege, siret, num_tva, email_contact, telephone_contact, created_at').eq('id', client_id).maybeSingle(),
      supabaseServiceRole.from('fiches').select('*').eq('client_id', client_id),
      supabaseServiceRole.from('fiches_bar').select('*').eq('client_id', client_id),
      supabaseServiceRole.from('ingredients').select('*').eq('client_id', client_id),
      supabaseServiceRole.from('ingredients_bar').select('*').eq('client_id', client_id),
      supabaseServiceRole.from('fiche_ingredients').select('*').eq('client_id', client_id),
      supabaseServiceRole.from('fiche_bar_ingredients').select('*').eq('client_id', client_id),
    ])

    const export_data = {
      exported_at:         new Date().toISOString(),
      rgpd_info:           'Export de vos données personnelles conformément au RGPD article 20 (droit à la portabilité).',
      etablissement:       client,
      cuisine: {
        fiches:             fiches || [],
        ingredients:        ingredients || [],
        fiche_ingredients:  ficheIngredients || [],
      },
      bar: {
        fiches:             fichesBar || [],
        ingredients:        ingredientsBar || [],
        fiche_ingredients:  ficheBarIngredients || [],
      },
    }

    return new Response(JSON.stringify(export_data, null, 2), {
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="skalcook-export-${client_id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
