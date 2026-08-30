import { api } from './api'

/*
 * IN-MEMORY КЕШ ДАННЫХ ЭКРАНА «СЕГОДНЯ»
 *
 * Today.jsx фетчил шесть запросов разом (rituals, ascezas, quote,
 * checkin, themes, settings) при каждом монтировании — то есть на
 * каждое переключение вкладки BottomNavigation туда и обратно, даже
 * если ничего не изменилось. Тот же паттерн, что чинили в
 * mentalixHistoryCache.js для диалогов с AI-персонами.
 *
 * Кешируется весь снимок разом, одним ключом на пользователя — все
 * шесть запросов всегда фетчатся вместе, отдельного кеша на каждый
 * не нужно. Module-level Map, не localStorage — переживает только
 * текущую сессию вкладки.
 *
 * TTL короче, чем у истории диалогов (60с): rituals/ascezas/checkin —
 * более «живые» данные, к которым пользователь может вернуться после
 * реального действия (отметил ритуал, прошёл чек-ин) быстрее, чем за
 * минуту.
 */

const TODAY_CACHE_TTL_MS = 30_000
const TODAY_SNAPSHOT_TTL_MS = 5 * 60_000
const TODAY_SNAPSHOT_VERSION = 1
const TODAY_SNAPSHOT_KEY_PREFIX = 'mentalix:today:snapshot:v1:'

const cache = new Map()
const inFlight = new Map()

function snapshotKey(userId) {
  return `${TODAY_SNAPSHOT_KEY_PREFIX}${userId}`
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function safeId(value) {
  return typeof value === 'string' || finiteNumber(value) ? value : null
}

function safeScalar(value) {
  return value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    finiteNumber(value)
    ? value
    : null
}

function sanitizeRituals(rituals) {
  if (!Array.isArray(rituals)) return []

  return rituals.map(ritual => ({
    id: safeId(ritual?.id),
    name: typeof ritual?.name === 'string' ? ritual.name : '',
    min_version: typeof ritual?.min_version === 'string' ? ritual.min_version : null,
    today_level: safeScalar(ritual?.today_level),
  }))
}

function sanitizeAscezas(ascezas) {
  if (!Array.isArray(ascezas)) return []

  return ascezas.map(asceza => ({
    id: safeId(asceza?.id),
    name: typeof asceza?.name === 'string' ? asceza.name : '',
    today_status: safeScalar(asceza?.today_status),
  }))
}

function sanitizeCheckin(checkin) {
  if (!checkin || typeof checkin !== 'object') return null

  return {
    mood: finiteNumber(checkin.mood) ? checkin.mood : null,
    emotion: typeof checkin.emotion === 'string' ? checkin.emotion : null,
    review_completed_at:
      typeof checkin.review_completed_at === 'string' ? checkin.review_completed_at : null,
  }
}

function sanitizeThemes(themes) {
  if (!Array.isArray(themes)) return []

  return themes.map(theme => ({
    id: safeId(theme?.id),
    title: typeof theme?.title === 'string' ? theme.title : '',
    subtitle: typeof theme?.subtitle === 'string' ? theme.subtitle : '',
    total_days: finiteNumber(theme?.total_days) ? theme.total_days : 0,
    reflected_days: finiteNumber(theme?.reflected_days) ? theme.reflected_days : 0,
    is_current: Boolean(theme?.is_current),
  }))
}

function sanitizeTodayData(data) {
  return {
    rituals: sanitizeRituals(data?.rituals),
    ascezas: sanitizeAscezas(data?.ascezas),
    quote: typeof data?.quote?.text === 'string' ? { text: data.quote.text } : null,
    checkin: sanitizeCheckin(data?.checkin),
    themes: sanitizeThemes(data?.themes),
    settings: {
      review_hour: finiteNumber(data?.settings?.review_hour) ? data.settings.review_hour : 19,
    },
  }
}

function isSnapshotDataShape(data) {
  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Array.isArray(data.rituals) &&
    Array.isArray(data.ascezas) &&
    Array.isArray(data.themes) &&
    (data.checkin === null || typeof data.checkin === 'object') &&
    (data.quote === null || typeof data.quote === 'object') &&
    data.settings &&
    typeof data.settings === 'object' &&
    !Array.isArray(data.settings)
  )
}

function removeSnapshot(userId) {
  try {
    window.sessionStorage.removeItem(snapshotKey(userId))
  } catch {
    // sessionStorage can be unavailable or blocked; memory cache remains usable.
  }
}

function readSnapshot(userId) {
  try {
    const raw = window.sessionStorage.getItem(snapshotKey(userId))
    if (!raw) return null

    const snapshot = JSON.parse(raw)
    const age = Date.now() - snapshot?.savedAt

    if (
      snapshot?.version !== TODAY_SNAPSHOT_VERSION ||
      !finiteNumber(snapshot?.savedAt) ||
      age < 0 ||
      age > TODAY_SNAPSHOT_TTL_MS ||
      !isSnapshotDataShape(snapshot.data)
    ) {
      removeSnapshot(userId)
      return null
    }

    return sanitizeTodayData(snapshot.data)
  } catch {
    removeSnapshot(userId)
    return null
  }
}

function writeSnapshot(userId, data) {
  try {
    window.sessionStorage.setItem(
      snapshotKey(userId),
      JSON.stringify({
        version: TODAY_SNAPSHOT_VERSION,
        savedAt: Date.now(),
        data: sanitizeTodayData(data),
      })
    )
  } catch {
    // sessionStorage quota/security errors must not block Today data.
  }
}

export function peekTodaySnapshot(userId) {
  return readSnapshot(userId)
}

export async function fetchTodayData(userId, { force = false } = {}) {
  const cached = cache.get(userId)

  if (!force && cached && Date.now() - cached.fetchedAt < TODAY_CACHE_TTL_MS) {
    return cached.data
  }

  if (inFlight.has(userId)) {
    return inFlight.get(userId)
  }

  const request = Promise.all([
    api.rituals.list(userId),
    api.ascezas.list(userId),
    api.quotes.today(userId),
    api.checkin.today(userId).catch(() => null),
    api.themes.list(userId).catch(() => []),
    api.profile.getSettings(userId).catch(() => null),
  ])
    .then(([rituals, ascezas, quote, checkin, themes, settings]) => {
      const data = { rituals, ascezas, quote, checkin, themes, settings }

      cache.set(userId, { data, fetchedAt: Date.now() })
      writeSnapshot(userId, data)

      return data
    })
    .finally(() => {
      inFlight.delete(userId)
    })

  inFlight.set(userId, request)

  return request
}

export function invalidateTodayData(userId) {
  cache.delete(userId)
}
