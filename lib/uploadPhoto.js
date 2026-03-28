const MIME_MAP = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
}

/**
 * Upload une photo de fiche vers Supabase Storage.
 *
 * Contourne le bug du SDK Supabase : quand fileBody instanceof Blob,
 * l'option `contentType` est ignorée (FormData utilise file.type).
 * On lit les octets bruts via arrayBuffer() et on crée un Blob typé
 * manuellement, garantissant le bon Content-Type côté serveur.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ clientId: string, ficheId: string, file: File|Blob, isBar?: boolean }} opts
 * @returns {Promise<string>} URL publique de la photo uploadée
 */
export async function uploadFichePhoto(supabase, { clientId, ficheId, file, isBar = false }) {
  const ext = file.name.split('.').pop().toLowerCase()
  const mimeType = MIME_MAP[ext] || 'image/jpeg'
  const prefix = isBar ? `bar-${ficheId}` : ficheId
  const path = `${clientId}/${prefix}.${ext}`

  // Lire les octets bruts et créer un Blob avec le bon MIME type forcé
  const buffer = await file.arrayBuffer()
  const blob = new Blob([buffer], { type: mimeType })

  // Supprimer tous les fichiers existants pour ce préfixe (toutes extensions)
  const { data: existing } = await supabase.storage
    .from('fiches-photos').list(clientId, { search: prefix })
  if (existing?.length) {
    await supabase.storage.from('fiches-photos')
      .remove(existing.map(f => `${clientId}/${f.name}`))
  }

  // Uploader le blob fraîchement typé
  const { error } = await supabase.storage
    .from('fiches-photos').upload(path, blob, { cacheControl: '3600', upsert: false })
  if (error) throw new Error(`Upload échoué : ${error.message}`)

  // Retourner l'URL publique (le bucket fiches-photos est public)
  const { data } = supabase.storage.from('fiches-photos').getPublicUrl(path)
  return data.publicUrl
}
