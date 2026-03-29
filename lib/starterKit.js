import { supabase } from './supabase'

/** 20 ingrédients de base (prix indicatifs). */
export const STARTER_INGREDIENTS = [
  { nom: 'Sel fin', prix_kg: 2.5, unite: 'kg' },
  { nom: 'Poivre noir', prix_kg: 28, unite: 'kg' },
  { nom: 'Beurre doux', prix_kg: 9.5, unite: 'kg' },
  { nom: 'Huile d\'olive', prix_kg: 12, unite: 'L' },
  { nom: 'Oignon jaune', prix_kg: 1.8, unite: 'kg' },
  { nom: 'Farine T55', prix_kg: 1.2, unite: 'kg' },
  { nom: 'Œuf', prix_kg: 0.35, unite: 'u' },
  { nom: 'Crème 35%', prix_kg: 6.2, unite: 'L' },
  { nom: 'Pain burger', prix_kg: 1.2, unite: 'u' },
  { nom: 'Steak haché 15%', prix_kg: 14, unite: 'kg' },
  { nom: 'Cheddar', prix_kg: 18, unite: 'kg' },
  { nom: 'Cornichons', prix_kg: 8, unite: 'kg' },
  { nom: 'Ketchup', prix_kg: 4.5, unite: 'kg' },
  { nom: 'Moutarde de Dijon', prix_kg: 6, unite: 'kg' },
  { nom: 'Laitue iceberg', prix_kg: 3.2, unite: 'kg' },
  { nom: 'Tomate', prix_kg: 3.5, unite: 'kg' },
  { nom: 'Ail', prix_kg: 12, unite: 'kg' },
  { nom: 'Persil', prix_kg: 1.8, unite: 'botte' },
  { nom: 'Paprika', prix_kg: 22, unite: 'kg' },
  { nom: 'Sauce BBQ', prix_kg: 8.5, unite: 'L' },
]

const DEMO_FICHE_NOM = 'Burger Signature'

/** Lignes démo (noms = STARTER_INGREDIENTS), 4 portions. */
const DEMO_RECIPE_LINES = [
  { nom: 'Pain burger', quantite: 4, unite: 'u' },
  { nom: 'Steak haché 15%', quantite: 0.6, unite: 'kg' },
  { nom: 'Cheddar', quantite: 0.08, unite: 'kg' },
  { nom: 'Oignon jaune', quantite: 0.06, unite: 'kg' },
  { nom: 'Tomate', quantite: 0.1, unite: 'kg' },
  { nom: 'Laitue iceberg', quantite: 0.05, unite: 'kg' },
  { nom: 'Cornichons', quantite: 0.04, unite: 'kg' },
  { nom: 'Sauce BBQ', quantite: 0.06, unite: 'L' },
  { nom: 'Huile d\'olive', quantite: 0.02, unite: 'L' },
  { nom: 'Moutarde de Dijon', quantite: 0.015, unite: 'kg' },
  { nom: 'Sel fin', quantite: 0.002, unite: 'kg' },
  { nom: 'Poivre noir', quantite: 0.001, unite: 'kg' },
]

const DEMO_ALLERGENES = ['gluten', 'lait', 'oeufs', 'moutarde']

function localStarterDoneKey(clientId) {
  return `sk_starter_kit_done_${clientId}`
}

/**
 * Seed ingrédients + fiche démo une fois par établissement (anti-page blanche).
 * @param {string} userId — auth user (traçabilité ; pas utilisé en DB si non requis)
 * @returns {Promise<{ seeded: boolean, skipped?: string }>}
 */
export async function seedUserIngredients(userId, clientId) {
  if (!clientId) return { seeded: false, skipped: 'no_client' }

  try {
    if (typeof window !== 'undefined') {
      try {
        if (window.localStorage.getItem(localStarterDoneKey(clientId)) === '1') {
          return { seeded: false, skipped: 'local_flag' }
        }
      } catch {
        // no-op
      }
    }

    const { data: clientRow } = await supabase
      .from('clients')
      .select('starter_kit_seeded_at')
      .eq('id', clientId)
      .maybeSingle()

    if (clientRow?.starter_kit_seeded_at) {
      return { seeded: false, skipped: 'already_seeded' }
    }

    const { data: demoExists } = await supabase
      .from('fiches')
      .select('id')
      .eq('client_id', clientId)
      .ilike('nom', `${DEMO_FICHE_NOM}%`)
      .limit(1)
      .maybeSingle()

    if (demoExists) {
      await supabase
        .from('clients')
        .update({ starter_kit_seeded_at: new Date().toISOString() })
        .eq('id', clientId)
      return { seeded: false, skipped: 'demo_exists' }
    }

    const { count: ingCount } = await supabase
      .from('ingredients')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('est_sous_fiche', false)

    if ((ingCount ?? 0) > 0) {
      await supabase
        .from('clients')
        .update({ starter_kit_seeded_at: new Date().toISOString() })
        .eq('id', clientId)
      return { seeded: false, skipped: 'has_ingredients' }
    }

    const rows = STARTER_INGREDIENTS.map((r) => ({
      nom: r.nom,
      prix_kg: r.prix_kg,
      unite: r.unite,
      client_id: clientId,
      est_sous_fiche: false,
    }))

    const { data: insertedIngs, error: errIng } = await supabase
      .from('ingredients')
      .insert(rows)
      .select('id, nom')

    if (errIng || !insertedIngs?.length) {
      console.error('starterKit: ingredients', errIng)
      return { seeded: false, skipped: 'insert_ingredients_failed' }
    }

    const byNom = Object.fromEntries(insertedIngs.map((i) => [i.nom, i.id]))

    let { data: catPlat } = await supabase
      .from('categories_plats')
      .select('id')
      .eq('client_id', clientId)
      .eq('section', 'cuisine')
      .eq('nom', 'Plats')
      .maybeSingle()

    if (!catPlat) {
      const { data: anyCat } = await supabase
        .from('categories_plats')
        .select('id')
        .eq('client_id', clientId)
        .eq('section', 'cuisine')
        .order('ordre')
        .limit(1)
        .maybeSingle()
      catPlat = anyCat
    }

    let coutBrut = 0
    for (const line of DEMO_RECIPE_LINES) {
      const ingId = byNom[line.nom]
      const meta = STARTER_INGREDIENTS.find((s) => s.nom === line.nom)
      if (ingId && meta?.prix_kg) {
        coutBrut += meta.prix_kg * line.quantite
      }
    }

    const nbPortions = 4
    const coutPortion = coutBrut / nbPortions
    const prixTTC = 48

    const { data: fiche, error: errFiche } = await supabase
      .from('fiches')
      .insert([
        {
          nom: DEMO_FICHE_NOM,
          categorie: 'Plats',
          categorie_plat_id: catPlat?.id || null,
          nb_portions: nbPortions,
          prix_ttc: prixTTC,
          description:
            'Fiche de démonstration — explorez les ingrédients, le food cost et les allergènes. Modifiez ou supprimez-la quand vous voulez.',
          saison: 'Printemps 2026',
          allergenes: DEMO_ALLERGENES,
          cout_portion: parseFloat(coutPortion.toFixed(4)),
          perte: 0,
          client_id: clientId,
          is_sub_fiche: false,
          archive: false,
        },
      ])
      .select('id')
      .single()

    if (errFiche || !fiche) {
      console.error('starterKit: fiche', errFiche)
      return { seeded: false, skipped: 'insert_fiche_failed' }
    }

    const fiRows = DEMO_RECIPE_LINES.map((line) => {
      const ingredient_id = byNom[line.nom]
      if (!ingredient_id) return null
      return {
        fiche_id: fiche.id,
        ingredient_id,
        quantite: line.quantite,
        unite: line.unite,
        client_id: clientId,
      }
    }).filter(Boolean)

    if (fiRows.length) {
      const { error: errFi } = await supabase.from('fiche_ingredients').insert(fiRows)
      if (errFi) console.error('starterKit: fiche_ingredients', errFi)
    }

    const { error: errClient } = await supabase
      .from('clients')
      .update({ starter_kit_seeded_at: new Date().toISOString() })
      .eq('id', clientId)

    if (errClient && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(localStarterDoneKey(clientId), '1')
      } catch {
        // no-op
      }
    }

    void userId
    return { seeded: true }
  } catch (e) {
    console.error('starterKit', e)
    return { seeded: false, skipped: 'exception' }
  }
}
