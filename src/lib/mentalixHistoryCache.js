import { api } from './api'
import { normalizeHistory } from './mentalixHistoryUtils.js'

/*
 * IN-MEMORY КЕШ ИСТОРИИ ДИАЛОГОВ MENTALIX
 *
 * Chat (Mentalix.jsx) и PersonaPicker.jsx дёргают один и тот же
 * api.mentalix.history(userId, persona) — Chat за полной историей,
 * PersonaPicker за последним сообщением для превью на карточке.
 * Модульный Map, не localStorage — переживает только текущую сессию
 * вкладки и не порождает лишних запросов при повторном открытии.
 */

const HISTORY_CACHE_TTL_MS = 60_000

const cache = new Map()
const inFlight = new Map()
const generations = new Map()

function cacheKey(userId, persona) {
  return `${userId}:${persona}`
}

export async function fetchHistory(userId, persona) {
  const key = cacheKey(userId, persona)
  const cached = cache.get(key)

  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return cached.data
  }
  const pending = inFlight.get(key)
  if (pending) return pending

  const generation = generations.get(key) || 0
  const request = api.mentalix
    .history(userId, persona)
    .then(data => {
      const normalized = normalizeHistory(data)
      if ((generations.get(key) || 0) === generation) {
        cache.set(key, { data: normalized, fetchedAt: Date.now() })
      }
      return normalized
    })
    .finally(() => {
      if (inFlight.get(key) === request) inFlight.delete(key)
    })

  inFlight.set(key, request)
  return request
}

export function invalidateHistory(userId, persona) {
  const key = cacheKey(userId, persona)
  generations.set(key, (generations.get(key) || 0) + 1)
  cache.delete(key)
}
