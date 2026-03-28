/**
 * Parse le système d'exploitation / type d'appareil depuis un User-Agent.
 * @param {string|null} ua
 * @returns {string}
 */
export function parseDevice(ua) {
  if (!ua) return 'Inconnu'
  if (/iPhone|iPad/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Autre'
}

/**
 * Parse le navigateur depuis un User-Agent.
 * @param {string|null} ua
 * @returns {string}
 */
export function parseBrowser(ua) {
  if (!ua) return 'Inconnu'
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Autre'
}
