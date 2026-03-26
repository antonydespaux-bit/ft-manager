const DEFAULT_SUPERADMIN_EMAILS = ['antony.despaux@hotmail.fr', 'antony@skalcook.com']

function parseEmails(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getSuperadminEmails() {
  const raw = typeof window === 'undefined'
    ? (process.env.SUPERADMIN_EMAILS || process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS || '')
    : (process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS || '')

  const parsed = parseEmails(raw)
  return parsed.length > 0 ? parsed : DEFAULT_SUPERADMIN_EMAILS
}

export function isSuperadminEmail(email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return false
  return getSuperadminEmails().includes(normalized)
}
