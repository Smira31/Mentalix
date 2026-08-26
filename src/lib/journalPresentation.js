export const LONG_MESSAGE_CHAR_LIMIT = 720

export function messageTimestamp(message) {
  const value =
    message?.created_at ??
    message?.createdAt ??
    message?.sent_at ??
    message?.timestamp ??
    null

  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function messageDayKey(message) {
  const date = messageTimestamp(message)
  if (!date) return null

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatJournalDate(message, locale = 'ru-RU') {
  const date = messageTimestamp(message)
  if (!date) return null

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function isLongJournalMessage(message, limit = LONG_MESSAGE_CHAR_LIMIT) {
  return String(message?.content || '').length > limit
}

export function journalMessageKey(message, index) {
  return String(message?.id ?? message?.message_id ?? `${message?.role || 'message'}-${index}`)
}

export function groupJournalMessages(messages) {
  const groups = []
  let current = null

  messages.forEach((message, index) => {
    const dayKey = messageDayKey(message)
    const groupKey = dayKey || 'undated'

    if (!current || current.key !== groupKey) {
      current = {
        key: groupKey,
        label: dayKey ? formatJournalDate(message) : null,
        messages: [],
      }
      groups.push(current)
    }

    current.messages.push({ message, index })
  })

  return groups
}
