import { api } from './api'

/*
 * IN-MEMORY КЕШ ИСТОРИИ ДИАЛОГОВ MENTALIX
 *
 * Chat (Mentalix.jsx) и PersonaPicker.jsx дёргают один и тот же
 * api.mentalix.history(userId, persona) — Chat за полной историей,
 * PersonaPicker за последним сообщением для превью на карточке.
 * Без общего кеша: закрытие диалога = 3 параллельных запроса
 * (превью всех персон в PersonaPicker), повторное открытие той же
 * персоны = ещё один — все без необходимости, если история не
 * менялась. Модульный Map, не localStorage — переживает только
 * текущую сессию вкладки, чего достаточно: цель просто не дублировать
 * запросы в пределах одного открытия приложения.
 */

const HISTORY_CACHE_TTL_MS = 60_000

const cache = new Map()

function cacheKey(userId, persona) {
  return `${userId}:${persona}`
}

export async function fetchHistory(userId, persona) {
  const key = cacheKey(userId, persona)
  const cached = cache.get(key)

  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return cached.data
  }

  const data = await api.mentalix.history(userId, persona)

  cache.set(key, { data, fetchedAt: Date.now() })

  return data
}

export function invalidateHistory(userId, persona) {
  cache.delete(cacheKey(userId, persona))
}
