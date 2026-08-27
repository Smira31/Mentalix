export function withQuery(path, params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.filter(item => item !== undefined && item !== null).forEach(item => query.append(key, String(item)))
      return
    }
    query.append(key, String(value))
  })

  const serialized = query.toString()
  return serialized ? `${path}?${serialized}` : path
}
