import { api } from './api'

/*
 * IN-MEMORY КЕШ ЭКРАНА «ПРАКТИКИ» (Practices.jsx)
 *
 * Practices.jsx рефетчил api.rituals.list() + api.ascezas.list() при
 * каждом монтировании — то есть на каждое переключение вкладки
 * BottomNavigation туда и обратно, даже если ничего не изменилось. Тот
 * же паттерн, что чинили в todayDataCache.js/trendsDataCache.js/
 * libraryDataCache.js.
 *
 * Один снимок на пользователя — оба запроса всегда фетчатся вместе,
 * отдельного кеша на каждый не нужно (как в todayDataCache.js).
 *
 * TTL 30 сек, как у todayDataCache.js — это те же ритуалы/аскезы,
 * что и на экране «Сегодня», и завязаны на те же действия
 * пользователя (отметка ритуала/аскезы).
 *
 * peekPracticesData() — синхронный, без сети, для lazy-инициализации
 * стейта в Practices.jsx: при тёплом кеше на монтировании нет
 * промежуточного кадра пустого списка.
 *
 * В отличие от todayDataCache.js/libraryDataCache.js/trendsDataCache.js,
 * здесь нет отдельного sessionStorage-снапшота: Practices.jsx и так не
 * показывал "Загрузка..." при пустых данных (рендерил список с пустыми
 * rituals/ascezas), а не отдельный loading-гейт — второй слой персистентности
 * не нужен для той же задачи.
 */

const PRACTICES_CACHE_TTL_MS = 30_000

const cache = new Map()
const inFlight = new Map()

function freshEntry(userId) {
  const cached = cache.get(userId)

  if (cached && Date.now() - cached.fetchedAt < PRACTICES_CACHE_TTL_MS) {
    return cached
  }

  return null
}

export function peekPracticesData(userId) {
  return freshEntry(userId)?.data ?? null
}

export async function fetchPracticesData(userId, { force = false } = {}) {
  const cached = freshEntry(userId)

  if (!force && cached) {
    return cached.data
  }

  if (inFlight.has(userId)) {
    return inFlight.get(userId)
  }

  const request = Promise.all([api.rituals.list(userId), api.ascezas.list(userId)])
    .then(([rituals, ascezas]) => {
      const data = { rituals, ascezas }

      cache.set(userId, { data, fetchedAt: Date.now() })

      return data
    })
    .finally(() => {
      inFlight.delete(userId)
    })

  inFlight.set(userId, request)

  return request
}

export function invalidatePracticesData(userId) {
  cache.delete(userId)
}
