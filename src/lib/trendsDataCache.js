import { api } from './api'
import { sanitizeTrendsData } from './trendsDataSanitizer'

/*
 * Кеш данных экрана «Аналитика». Ключ включает userId и период, чтобы
 * переключение 7/14/30/90 дней не смешивало разные окна наблюдений.
 * Нормализация выполняется до сохранения и в memory cache, и в sessionStorage:
 * UI никогда не строит выводы по malformed или частично повреждённому snapshot.
 */
const TRENDS_CACHE_TTL_MS = 30_000
const TRENDS_SNAPSHOT_TTL_MS = 5 * 60_000
const TRENDS_SNAPSHOT_VERSION = 2
const TRENDS_SNAPSHOT_KEY_PREFIX = 'mentalix:trends:snapshot:v2:'

const cache = new Map()
const inFlight = new Map()

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function snapshotKey(userId, days) {
  return `${TRENDS_SNAPSHOT_KEY_PREFIX}${userId}:${days}`
}

function removeSnapshot(userId, days) {
  try {
    window.sessionStorage.removeItem(snapshotKey(userId, days))
  } catch {
    // sessionStorage can be unavailable; memory cache remains usable.
  }
}

function readSnapshot(userId, days) {
  try {
    const raw = window.sessionStorage.getItem(snapshotKey(userId, days))
    if (!raw) return null

    const snapshot = JSON.parse(raw)
    const age = Date.now() - snapshot?.savedAt
    const validShape =
      snapshot &&
      typeof snapshot === 'object' &&
      !Array.isArray(snapshot) &&
      snapshot.version === TRENDS_SNAPSHOT_VERSION &&
      finiteNumber(snapshot.savedAt) &&
      snapshot.data &&
      typeof snapshot.data === 'object' &&
      !Array.isArray(snapshot.data) &&
      snapshot.data.analytics &&
      typeof snapshot.data.analytics === 'object' &&
      Array.isArray(snapshot.data.checkins)

    if (!validShape || age < 0 || age > TRENDS_SNAPSHOT_TTL_MS) {
      removeSnapshot(userId, days)
      return null
    }

    return sanitizeTrendsData(snapshot.data)
  } catch {
    removeSnapshot(userId, days)
    return null
  }
}

function writeSnapshot(userId, days, data) {
  try {
    window.sessionStorage.setItem(
      snapshotKey(userId, days),
      JSON.stringify({
        version: TRENDS_SNAPSHOT_VERSION,
        savedAt: Date.now(),
        data,
      })
    )
  } catch {
    // sessionStorage quota/security errors must not block Trends.
  }
}

function cacheKey(userId, days) {
  return `${userId}:${days}`
}

function freshEntry(userId, days) {
  const cached = cache.get(cacheKey(userId, days))

  if (cached && Date.now() - cached.fetchedAt < TRENDS_CACHE_TTL_MS) {
    return cached
  }

  return null
}

export function peekTrendsData(userId, days) {
  return freshEntry(userId, days)?.data ?? null
}

export function peekTrendsSnapshot(userId, days) {
  return readSnapshot(userId, days)
}

export async function fetchTrendsData(userId, days, { force = false } = {}) {
  const cached = freshEntry(userId, days)

  if (!force && cached) {
    return cached.data
  }

  const key = cacheKey(userId, days)
  if (inFlight.has(key)) return inFlight.get(key)

  const request = Promise.all([
    api.analytics.get(userId, days),
    api.checkin.history(userId, days).catch(() => []),
  ])
    .then(([analytics, checkins]) => {
      const data = sanitizeTrendsData({ analytics, checkins })

      cache.set(key, { data, fetchedAt: Date.now() })
      writeSnapshot(userId, days, data)

      return data
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, request)

  return request
}

export function invalidateTrendsData(userId, days) {
  cache.delete(cacheKey(userId, days))
}
