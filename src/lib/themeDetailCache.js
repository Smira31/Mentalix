import { api } from './api'
import { withRetry } from './todayRetry'

/*
 * КЕШ ДЕТАЛЕЙ ТЕМЫ НЕДЕЛИ (ThemeScreen + ThemeCarouselScreen)
 *
 * api.themes.get(themeId, userId) фетчился заново при каждом монтировании
 * ThemeScreen и ThemeCarouselScreen — то есть на каждое открытие темы
 * из карусели, каждый возврат из записи, каждое переключение темы в
 * «Все темы». Тот же паттерн, что чинили в themesDataCache.js для списка
 * и в streakSnapshotCache.js для серии.
 *
 * Два слоя:
 *   1. In-memory Map — горячий кеш, TTL 30с (как themesDataCache).
 *   2. sessionStorage — переживает размонтирование/переход вкладки,
 *      TTL 5 минут (как todayDataCache snapshot). На холодном старте
 *      после возврата на экран темы данные показываются мгновенно,
 *      а свежий запрос идёт в фоне.
 *
 * Ключ — userId + themeId: детали разных тем не смешиваются.
 * Снимок хранит уже обработанный ответ api.themes.get (с days[]),
 * чтобы потребитель получал готовые данные без дублирования логики.
 *
 * Безопасность устаревших данных: TTL гарантирует, что ошибка не
 * маскируется бесконечно — после истечения TTL выполняется свежий
 * запрос. persistReflection после сохранения вызывает invalidate,
 * чтобы следующий показ темы был актуальным.
 */

const DETAIL_CACHE_TTL_MS = 30_000
const DETAIL_SNAPSHOT_TTL_MS = 5 * 60_000
const DETAIL_SNAPSHOT_VERSION = 1
const SNAPSHOT_KEY_PREFIX = 'mentalix:theme-detail:v1:'

const cache = new Map()
const inFlight = new Map()

function cacheKey(userId, themeId) {
  return `${userId}:${themeId}`
}

function snapshotKey(userId, themeId) {
  return `${SNAPSHOT_KEY_PREFIX}${userId}:${themeId}`
}

function isThemeDetail(value) {
  return (
    value &&
    typeof value === 'object' &&
    (typeof value.id === 'string' || typeof value.id === 'number') &&
    Array.isArray(value.days)
  )
}

function freshEntry(userId, themeId) {
  const cached = cache.get(cacheKey(userId, themeId))

  if (cached && Date.now() - cached.fetchedAt < DETAIL_CACHE_TTL_MS) {
    return cached
  }

  return null
}

/*
 * Синхронное чтение из sessionStorage — для lazy-инициализации стейта
 * в ThemeScreen/ThemeCarouselScreen: при тёплом снимке на монтировании
 * нет промежуточного кадра «Загрузка...».
 */
export function peekThemeDetail(userId, themeId) {
  if (userId == null || themeId == null) return null

  // Сначала in-memory — свежее и быстрее
  const hot = freshEntry(userId, themeId)
  if (hot) return hot.data

  try {
    const raw = sessionStorage.getItem(snapshotKey(userId, themeId))
    if (!raw) return null

    const snapshot = JSON.parse(raw)
    const age = Date.now() - snapshot?.savedAt

    if (
      snapshot?.version !== DETAIL_SNAPSHOT_VERSION ||
      !Number.isFinite(snapshot?.savedAt) ||
      age < 0 ||
      age > DETAIL_SNAPSHOT_TTL_MS ||
      !isThemeDetail(snapshot.data)
    ) {
      sessionStorage.removeItem(snapshotKey(userId, themeId))
      return null
    }

    return snapshot.data
  } catch {
    try {
      sessionStorage.removeItem(snapshotKey(userId, themeId))
    } catch {
      // sessionStorage недоступен — кеш работает только в памяти
    }
    return null
  }
}

function writeSnapshot(userId, themeId, data) {
  if (!isThemeDetail(data)) return

  try {
    sessionStorage.setItem(
      snapshotKey(userId, themeId),
      JSON.stringify({
        version: DETAIL_SNAPSHOT_VERSION,
        savedAt: Date.now(),
        data,
      })
    )
  } catch {
    // Квота/безопасность не должны блокировать работу
  }
}

/*
 * fetchThemeDetail — основной запрос с кешированием.
 * force=true обходит кеш (для retry-кнопки и после сохранения).
 */
export async function fetchThemeDetail(userId, themeId, { force = false } = {}) {
  if (userId == null || themeId == null) return null

  const cached = freshEntry(userId, themeId)
  if (!force && cached) return cached.data

  const key = cacheKey(userId, themeId)

  if (inFlight.has(key)) {
    return inFlight.get(key)
  }

  const request = (async () => {
    const detail = await withRetry(() => api.themes.get(themeId, userId))

    if (!isThemeDetail(detail)) return null

    cache.set(key, { data: detail, fetchedAt: Date.now() })
    writeSnapshot(userId, themeId, detail)

    return detail
  })().finally(() => {
    inFlight.delete(key)
  })

  inFlight.set(key, request)

  return request
}

/*
 * Сброс конкретной темы — после persistReflection, чтобы следующий
 * показ был актуальным. Очищает оба слоя.
 */
export function invalidateThemeDetail(userId, themeId) {
  if (userId == null || themeId == null) return

  cache.delete(cacheKey(userId, themeId))

  try {
    sessionStorage.removeItem(snapshotKey(userId, themeId))
  } catch {
    // sessionStorage недоступен — in-memory уже очищен
  }
}

/*
 * Сброс всех деталей пользователя — при смене пользователя.
 */
export function invalidateAllThemeDetails(userId) {
  if (userId == null) return

  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) cache.delete(key)
  }

  try {
    const prefix = `${SNAPSHOT_KEY_PREFIX}${userId}:`
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(prefix)) sessionStorage.removeItem(key)
    }
  } catch {
    // sessionStorage недоступен
  }
}
