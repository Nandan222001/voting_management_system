export function getApiOrigin() {
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
  return apiBase.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
}

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^(https?:)?\/\//i.test(trimmed) || /^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed
  }
  if (trimmed.startsWith('/')) return `${getApiOrigin()}${trimmed}`
  return `${getApiOrigin()}/${trimmed.replace(/^\/+/, '')}`
}

export function pickImageUrl(item, fields = ['image_url', 'logo_url', 'profile_image', 'candidate_image']) {
  if (!item) return null
  for (const field of fields) {
    const resolved = resolveMediaUrl(item[field])
    if (resolved) return resolved
  }
  return null
}
