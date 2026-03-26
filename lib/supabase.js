import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
})

export const getClientId = async () => {
  // Client-side uniquement (localStorage + URL + auth.getUser)
  if (typeof window === 'undefined') return null

  // 1) localStorage (source la plus rapide)
  const stored = localStorage.getItem('client_id')
  if (stored) return stored

  // 2) URL (fallback) : ?client_id=... ou ?clientId=...
  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('client_id') || params.get('clientId') || params.get('clientID')
    if (fromUrl) {
      localStorage.setItem('client_id', fromUrl)
      return fromUrl
    }
  } catch (e) {
    // no-op
  }

  // 3) Requête Supabase (si possible) : récupérer user_metadata.client_id depuis la session
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return null

  const clientId = userData?.user?.user_metadata?.client_id
  if (clientId) {
    localStorage.setItem('client_id', clientId)
    return clientId
  }

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

function extractStoragePathFromPublicUrl(url, bucket) {
  if (!url || !bucket) return null
  try {
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.slice(idx + marker.length))
  } catch {
    return null
  }
}

async function isUrlReachable(url) {
  if (!url) return false
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return !!res.ok
  } catch {
    return false
  }
}

async function findBestFichePhotoPath(clientId, ficheId, isBar = false) {
  if (!clientId || !ficheId) return null
  const bucket = supabase.storage.from('fiches-photos')
  const prefix = isBar ? `bar-${ficheId}` : `${ficheId}`
  const { data, error } = await bucket.list(clientId, {
    limit: 100,
    search: prefix
  })
  if (error || !data || data.length === 0) return null
  const item = data.find((f) => f?.name?.startsWith(prefix)) || data[0]
  if (!item?.name) return null
  return `${clientId}/${item.name}`
}

// Repare automatiquement photo_url si URL invalide, expirée, ou bucket incohérent.
export const ensureFichePhotoUrl = async ({ tableName, ficheId, clientId, photoUrl, isBar = false }) => {
  if (!tableName || !ficheId || !clientId || !photoUrl) return photoUrl || null

  const currentPath = extractStoragePathFromPublicUrl(photoUrl, 'fiches-photos')
  const currentLooksValid = currentPath && currentPath.startsWith(`${clientId}/`)
  const reachable = currentLooksValid ? await isUrlReachable(photoUrl) : false
  if (currentLooksValid && reachable) {
    return photoUrl
  }

  const repairedPath = await findBestFichePhotoPath(clientId, ficheId, isBar)
  if (!repairedPath) return photoUrl

  const { data: urlData } = supabase.storage.from('fiches-photos').getPublicUrl(repairedPath)
  const repairedUrl = urlData?.publicUrl || photoUrl

  if (repairedUrl && repairedUrl !== photoUrl) {
    await supabase
      .from(tableName)
      .update({ photo_url: repairedUrl })
      .eq('id', ficheId)
      .eq('client_id', clientId)
  }

  return repairedUrl
}
