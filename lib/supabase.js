import { createClient } from '@supabase/supabase-js'
import { isSuperadminEmail } from './superadmin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
})

export const getClientId = async () => {
  // Client-side uniquement, avec validation stricte via acces_clients.
  if (typeof window === 'undefined') return null

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  const userEmail = (userData?.user?.email || '').toLowerCase().trim()
  const isSuperAdmin = isSuperadminEmail(userEmail)
  if (userErr || !userId) return null

  const { data: accesRows, error: accesErr } = await supabase
    .from('acces_clients')
    .select('client_id')
    .eq('user_id', userId)

  if (accesErr) return null
  const authorized = new Set((accesRows || []).map((r) => r?.client_id).filter(Boolean))

  let fromStorage = null
  try {
    fromStorage = localStorage.getItem('client_id')
  } catch {
    fromStorage = null
  }

  let fromUrl = null
  try {
    const params = new URLSearchParams(window.location.search)
    fromUrl = params.get('client_id') || params.get('clientId') || params.get('clientID')
  } catch {
    fromUrl = null
  }

  const candidate = fromStorage || fromUrl

  // Priorité 1: superadmin -> autoriser le client sélectionné localement (centre de contrôle).
  if (isSuperAdmin && candidate) {
    try { localStorage.setItem('client_id', candidate) } catch {}
    return candidate
  }

  if (authorized.size === 0) return null

  // Priorité 2: `profils.client_id` en base (référence métier), s'il est toujours dans acces_clients.
  const { data: profilRow } = await supabase
    .from('profils')
    .select('client_id')
    .eq('id', userId)
    .maybeSingle()

  const profilClientId = profilRow?.client_id || null
  if (profilClientId && authorized.has(profilClientId)) {
    try { localStorage.setItem('client_id', profilClientId) } catch {}
    return profilClientId
  }

  // Priorité 3: localStorage / query string, seulement si autorisé.
  if (candidate && authorized.has(candidate)) {
    try { localStorage.setItem('client_id', candidate) } catch {}
    return candidate
  }

  // Priorité 4: un seul établissement autorisé.
  if (authorized.size === 1) {
    const [single] = Array.from(authorized)
    try { localStorage.setItem('client_id', single) } catch {}
    return single
  }

  // Cas multi-établissements: aucun choix valide actif.
  try { localStorage.removeItem('client_id') } catch {}
  return null
}

export const getParametres = async () => {
  const clientId = await getClientId()
  if (!clientId || clientId === 'undefined') {
    return {
      nom_etablissement: '',
      adresse: '',
      seuil_vert_cuisine: 28,
      seuil_orange_cuisine: 35,
      seuil_vert_boissons: 22,
      seuil_orange_boissons: 28,
      tva_restauration: 10,
    }
  }

  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle()

  return {
    nom_etablissement: data?.nom_etablissement || '',
    logo_url: data?.logo_url || null,
    adresse: data?.adresse || '',
    seuil_vert_cuisine: data?.seuil_vert_cuisine ?? 28,
    seuil_orange_cuisine: data?.seuil_orange_cuisine ?? 35,
    seuil_vert_boissons: data?.seuil_vert_boissons ?? 22,
    seuil_orange_boissons: data?.seuil_orange_boissons ?? 28,
    tva_restauration: data?.tva_restauration ?? 10,
  }
}

