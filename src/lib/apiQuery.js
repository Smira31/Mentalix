export function withQuery(path, params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    query.append(key, String(value))
  })

  const serialized = query.toString()
  return serialized ? `${path}?${serialized}` : path
}
