export const ANALYTICS_CARDS = [
  { id: 'calendar', title: 'Календарь настроения', section: 'Общее' },
  { id: 'emotions', title: 'Главные эмоции', section: 'Эмоции' },
  { id: 'up', title: 'Что тебя поднимает', section: 'Эмоции' },
  { id: 'down', title: 'Что тебя опускает', section: 'Эмоции' },
  { id: 'practices', title: 'Твои практики', section: 'Упражнения' },
]

export const ANALYTICS_CARDS_KEY = 'mentalix_analytics_cards'

export function normalizeCardPreferences(value) {
  const ids = ANALYTICS_CARDS.map(card => card.id)
  const order = Array.isArray(value?.order)
    ? [...new Set(value.order.filter(id => ids.includes(id))), ...ids.filter(id => !value.order.includes(id))]
    : ids
  const hidden = Array.isArray(value?.hidden)
    ? [...new Set(value.hidden.filter(id => ids.includes(id)))]
    : []
  return { order, hidden }
}

export function readCardPreferences(storage) {
  try {
    return normalizeCardPreferences(JSON.parse((storage ?? globalThis.localStorage).getItem(ANALYTICS_CARDS_KEY)))
  } catch {
    return normalizeCardPreferences(null)
  }
}

export function writeCardPreferences(value, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(ANALYTICS_CARDS_KEY, JSON.stringify(value))
  } catch {
    // Хранилище может быть недоступно: порядок остаётся рабочим в текущей сессии.
  }
}

export function moveCard(order, id, direction) {
  const index = order.indexOf(id)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return order
  const next = [...order]
  ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
  return next
}
