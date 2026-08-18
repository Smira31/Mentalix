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

const cache = new Map()

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

export async function fetchTrendsData(userId, days) {
  const cached = freshEntry(userId, days)

  if (cached) {
    return cached.data
  }

  const [analytics, checkins] = await Promise.all([
    api.analytics.get(userId, days),
    api.checkin.history(userId, days).catch(() => []),
  ])

  const data = { analytics, checkins }

  cache.set(cacheKey(userId, days), { data, fetchedAt: Date.now() })

  return data
}

export function invalidateTrendsData(userId, days) {
  cache.delete(cacheKey(userId, days))
}
