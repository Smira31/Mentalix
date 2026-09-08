function messageIdentity(message) {
  const id = message?.id ?? message?.message_id
  if (id != null && id !== '') return `id:${id}`
  const role = message?.role || ''
  const content = message?.content
  let serialized
  try {
    serialized = typeof content === 'string' ? content : JSON.stringify(content)
  } catch {
    serialized = ''
  }
  const timestamp =
    message?.created_at ?? message?.createdAt ?? message?.sent_at ?? message?.timestamp ?? ''
  // Без id одинаковый текст с тем же timestamp неотличим от дубликата.
  return `fallback:${role}:${serialized}:${timestamp}`
}

export function normalizeHistory(history) {
  if (!Array.isArray(history)) return []
  const seen = new Set()
  return history.filter(message => {
    const identity = messageIdentity(message)
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}
