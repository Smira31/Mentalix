import { api } from './api'

/*
 * IN-MEMORY КЕШ ДАННЫХ ЭКРАНА «ТРЕНДЫ» (Analytics.jsx)
 *
 * Analytics.jsx рефетчил api.analytics.get(userId, days) +
 * api.checkin.history(userId, days) при каждом монтировании — то есть на
 * каждое переключение вкладки BottomNavigation туда и обратно, даже если
 * ничего не изменилось. Тот же паттерн, что чинили в todayDataCache.js и
 * libraryDataCache.js.
 *
 * Ключ двухчастный — userId И days, а не только userId, как в
 * todayDataCache.js: days сейчас всегда 14, но экран может когда-нибудь
 * дать выбор периода, и тогда кеш по одному userId путал бы данные за
 * разные периоды. `${userId}:${days}` разводит их сразу.
 *
 * TTL 30 сек, как у todayDataCache.js — аналитика и история чек-инов
 * завязаны на те же действия пользователя (отметки ритуалов/аскез,
 * чек-ин), что и данные экрана «Сегодня».
 *
 * peekTrendsData() — синхронный, без сети и без await, для
 * lazy-инициализации стейта в Analytics.jsx: та же вспышка
 * "Загрузка..." при тёплом кеше, что чинили в libraryDataCache.js —
 * fetchTrendsData асинхронна даже при cache HIT, сама async-функция
 * резолвится через микротаск, а не в том же рендере.
 */

const TRENDS_CACHE_TTL_MS = 30_000
const TRENDS_SNAPSHOT_TTL_MS = 5 * 60_000
const TRENDS_SNAPSHOT_VERSION = 1
const TRENDS_SNAPSHOT_KEY_PREFIX = 'mentalix:trends:snapshot:v1:'

const cache = new Map()
const inFlight = new Map()

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function safeId(value) {
  return typeof value === 'string' || finiteNumber(value) ? value : null
}

function sanitizeRituals(rituals) {
  if (!Array.isArray(rituals)) return []

  return rituals.map(ritual => ({
    id: safeId(ritual?.id),
    name: typeof ritual?.name === 'string' ? ritual.name : '',
    completion_rate: finiteNumber(ritual?.completion_rate) ? ritual.completion_rate : 0,
  }))
}

function sanitizeAscezas(ascezas) {
  if (!Array.isArray(ascezas)) return []

  return ascezas.map(asceza => ({
    id: safeId(asceza?.id),
    name: typeof asceza?.name === 'string' ? asceza.name : '',
    category: typeof asceza?.category === 'string' ? asceza.category : null,
    streak: finiteNumber(asceza?.streak) ? asceza.streak : 0,
    clean_rate: finiteNumber(asceza?.clean_rate) ? asceza.clean_rate : 0,
    held_days: finiteNumber(asceza?.held_days) ? asceza.held_days : 0,
    breaks: finiteNumber(asceza?.breaks) ? asceza.breaks : 0,
  }))
}

function sanitizeAnalytics(analytics) {
  const source = analytics && typeof analytics === 'object' ? analytics : {}

  return {
    period_days: finiteNumber(source.period_days) ? source.period_days : 0,
    rituals: sanitizeRituals(source.rituals),
    ascezas: sanitizeAscezas(source.ascezas),
    insights: Array.isArray(source.insights)
      ? source.insights.filter(item => typeof item === 'string')
      : [],
    daily_activity: Array.isArray(source.daily_activity)
      ? source.daily_activity.map(day => ({
          date: typeof day?.date === 'string' ? day.date : '',
          count: finiteNumber(day?.count) ? day.count : 0,
          breaks: finiteNumber(day?.breaks) ? day.breaks : 0,
        }))
      : [],
  }
}

function sanitizeCheckins(checkins) {
  if (!Array.isArray(checkins)) return []

  return checkins.map(checkin => ({
    date: typeof checkin?.date === 'string' ? checkin.date : '',
    mood: finiteNumber(checkin?.mood) ? checkin.mood : null,
    energy: finiteNumber(checkin?.energy) ? checkin.energy : null,
    anxiety: finiteNumber(checkin?.anxiety) ? checkin.anxiety : null,
    focus: finiteNumber(checkin?.focus) ? checkin.focus : null,
    emotion: typeof checkin?.emotion === 'string' ? checkin.emotion : null,
    review_completed_at:
      typeof checkin?.review_completed_at === 'string' ? checkin.review_completed_at : null,
  }))
}

function sanitizeTrendsData(data) {
  return {
    analytics: sanitizeAnalytics(data?.analytics),
    checkins: sanitizeCheckins(data?.checkins),
  }
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
        data: sanitizeTrendsData(data),
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
      const data = { analytics, checkins }

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
