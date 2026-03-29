import { supabase } from './supabase'

/** Compte les fiches « principales » cuisine (hors sous-fiches), non archivées. */
export async function countCuisineFichesForFreemium(clientId) {
  const { count, error } = await supabase
    .from('fiches')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('archive', false)
    .neq('categorie', 'Sous-fiche')

  if (error) return { count: 0, error }
  return { count: count ?? 0, error: null }
}

/** Compte les fiches bar équivalentes (hors sous-fiches). */
export async function countBarFichesForFreemium(clientId) {
  const { count, error } = await supabase
    .from('fiches_bar')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('archive', false)
    .neq('categorie', 'Sous-fiche')

  if (error) return { count: 0, error }
  return { count: count ?? 0, error: null }
}

/** Quota global freemium : cuisine + bar. */
export async function countAllSheetsForFreemium(clientId) {
  const [cuisine, bar] = await Promise.all([
    countCuisineFichesForFreemium(clientId),
    countBarFichesForFreemium(clientId),
  ])
  return {
    count: cuisine.count + bar.count,
    error: cuisine.error || bar.error,
  }
}

export async function getSubscriptionPlan(userId) {
  if (!userId) return 'free'
  const { data, error } = await supabase
    .from('profils')
    .select('subscription_plan')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.subscription_plan) return 'free'
  return data.subscription_plan
}

export function isFreemiumFicheLimitReached(plan, totalCount) {
  return (plan || 'free') === 'free' && totalCount >= 5
}
