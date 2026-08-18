import { api } from './api'

/*
 * IN-MEMORY КЕШ СТАТЕЙ БИБЛИОТЕКИ
 *
 * Articles.jsx фетчил api.articles.list() при каждом монтировании — то
 * есть на каждое переключение вкладки BottomNavigation туда и обратно,
 * даже если ничего не изменилось. Тот же паттерн, что чинили в
 * mentalixHistoryCache.js и todayDataCache.js.
 *
 * Отличие от todayDataCache.js: статьи общие для всех пользователей,
 * api.articles.list() не принимает userId — кешируется одним ключом на
 * приложение, не по пользователю. Module-level Map всё равно, не
 * примитив, чтобы invalidate/re-fetch не требовали отдельной ветки кода.
 *
 * TTL 60 сек, как у mentalixHistoryCache.js — контент статичнее, чем
 * данные экрана «Сегодня» (30 сек у todayDataCache.js): статьи не
 * меняются в ответ на действия пользователя в этой сессии.
 *
 * peekArticles() — синхронный, без сети и без await, для lazy-инициализации
 * стейта в Articles.jsx: при тёплом кеше на монтировании нет промежуточного
 * кадра "Загрузка..." (fetchArticles асинхронна даже при cache HIT — сама
 * async-функция гарантированно резолвится через микротаск, а не в том же
 * рендере, поэтому синхронной альтернативы для начального стейта не было).
 */

const LIBRARY_CACHE_TTL_MS = 60_000

const CACHE_KEY = 'articles'

const cache = new Map()

function freshEntry() {
  const cached = cache.get(CACHE_KEY)

  if (cached && Date.now() - cached.fetchedAt < LIBRARY_CACHE_TTL_MS) {
    return cached
  }

  return null
}

export function peekArticles() {
  return freshEntry()?.data ?? null
}

export async function fetchArticles() {
  const cached = freshEntry()

  if (cached) {
    return cached.data
  }

  const data = await api.articles.list()

  cache.set(CACHE_KEY, { data, fetchedAt: Date.now() })

  return data
}

export function invalidateArticles() {
  cache.delete(CACHE_KEY)
}
