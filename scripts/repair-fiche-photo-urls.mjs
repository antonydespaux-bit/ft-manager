import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)
const BUCKET = 'fiches-photos'

function extractPublicPath(url) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

async function isReachable(url) {
  if (!url) return false
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function inspectUrl(url) {
  const out = {
    ok: false,
    status: null,
    contentType: null,
    isImage: false,
    jsonBody: null
  }
  if (!url) return out
  try {
    const res = await fetch(url, { method: 'HEAD' })
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    out.ok = res.ok
    out.status = res.status
    out.contentType = ct
    out.isImage = ct.startsWith('image/')

    if (ct.includes('application/json')) {
      try {
        const resJson = await fetch(url, { method: 'GET' })
        const text = await resJson.text()
        try {
          out.jsonBody = JSON.parse(text)
        } catch {
          out.jsonBody = text
        }
      } catch {
        out.jsonBody = null
      }
    }

    return out
  } catch {
    return out
  }
}

async function listClientFolderFiles(clientId) {
  if (!clientId) return []
  const { data, error } = await supabase.storage.from(BUCKET).list(clientId, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' }
  })
  if (error || !data) return []
  return data.map((f) => f?.name).filter(Boolean)
}

async function findPath(clientId, ficheId, isBar) {
  const prefix = isBar ? `bar-${ficheId}` : `${ficheId}`
  const { data, error } = await supabase.storage.from(BUCKET).list(clientId, {
    limit: 200,
    search: prefix
  })
  if (error || !data?.length) return null
  const file = data.find((f) => f?.name?.startsWith(prefix)) || data[0]
  return file?.name ? `${clientId}/${file.name}` : null
}

function buildPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data?.publicUrl || null
}

async function repairTable(tableName, isBar = false) {
  const { data: rows, error } = await supabase
    .from(tableName)
    .select('id, client_id, photo_url')
    .not('photo_url', 'is', null)

  if (error) throw error

  let scanned = 0
  let updated = 0
  let nulledCorrupted = 0
  let unchanged = 0
  let missing = 0

  for (const row of rows || []) {
    scanned++
    const currentUrl = row.photo_url
    console.log(`[${tableName}] ${row.id} -> ${currentUrl}`)
    const inspect = await inspectUrl(currentUrl)
    if (!inspect.ok) {
      console.log(`  status=${inspect.status || 'n/a'} content-type=${inspect.contentType || 'n/a'} (non reachable)`)
    } else {
      console.log(`  status=${inspect.status} content-type=${inspect.contentType || 'n/a'} isImage=${inspect.isImage}`)
      if (!inspect.isImage) {
        console.log('  warning: content-type is not image/* (possible hidden Supabase error payload)')
        if (inspect.jsonBody !== null) {
          console.log('  json response:', inspect.jsonBody)
        }
        const msg = String(inspect.jsonBody?.message || inspect.jsonBody?.error || '')
        if (/object not found/i.test(msg)) {
          const files = await listClientFolderFiles(row.client_id)
          console.log(`  files in ${row.client_id}/ :`, files)
        }
      }
    }

    const currentPath = extractPublicPath(currentUrl)
    const currentLooksValid = currentPath && currentPath.startsWith(`${row.client_id}/`)
    const payloadText = typeof inspect.jsonBody === 'string' ? inspect.jsonBody.toLowerCase() : ''
    const looksMultipartPayload =
      payloadText.includes('content-disposition: form-data') ||
      payloadText.includes('webkitformboundary') ||
      payloadText.includes('multipart/form-data')
    const isJsonOrMultipart =
      (inspect.contentType || '').includes('application/json') ||
      (inspect.contentType || '').includes('multipart/form-data') ||
      looksMultipartPayload

    if (isJsonOrMultipart) {
      const { error: nullErr } = await supabase
        .from(tableName)
        .update({ photo_url: null })
        .eq('id', row.id)
        .eq('client_id', row.client_id)
      if (nullErr) {
        console.error(`Nullify error ${tableName}:${row.id}`, nullErr.message)
      } else {
        nulledCorrupted++
        console.log(`Photo corrompue détectée et supprimée pour la fiche ${row.id} : Réupload nécessaire`)
      }
      continue
    }

    const ok = currentLooksValid ? (inspect.ok && inspect.isImage) : false

    if (ok) {
      unchanged++
      continue
    }

    const repairedPath = await findPath(row.client_id, row.id, isBar)
    if (!repairedPath) {
      missing++
      continue
    }

    const repairedUrl = buildPublicUrl(repairedPath)
    if (!repairedUrl || repairedUrl === currentUrl) {
      unchanged++
      continue
    }

    const { error: updateErr } = await supabase
      .from(tableName)
      .update({ photo_url: repairedUrl })
      .eq('id', row.id)
      .eq('client_id', row.client_id)

    if (updateErr) {
      console.error(`Update error ${tableName}:${row.id}`, updateErr.message)
      continue
    }
    updated++
  }

  return { tableName, scanned, updated, nulledCorrupted, unchanged, missing }
}

async function main() {
  console.log('Repairing fiche photo URLs...')
  const cuisine = await repairTable('fiches', false)
  const bar = await repairTable('fiches_bar', true)

  console.table([cuisine, bar])
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

