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
const LIBRARY_SNAPSHOT_TTL_MS = 5 * 60_000
const LIBRARY_SNAPSHOT_VERSION = 1
const LIBRARY_SNAPSHOT_KEY = 'mentalix:library:snapshot:v1'

const CACHE_KEY = 'articles'

const cache = new Map()
const inFlight = new Map()

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function safeId(value) {
  return typeof value === 'string' || finiteNumber(value) ? value : null
}

function sanitizeArticles(articles) {
  if (!Array.isArray(articles)) return []

  return articles.map(article => ({
    id: safeId(article?.id),
    title: typeof article?.title === 'string' ? article.title : '',
    excerpt: typeof article?.excerpt === 'string' ? article.excerpt : '',
    tag: typeof article?.tag === 'string' ? article.tag : null,
    minutes: finiteNumber(article?.minutes) ? article.minutes : 0,
    date: typeof article?.date === 'string' ? article.date : '',
  }))
}

function removeSnapshot() {
  try {
    window.sessionStorage.removeItem(LIBRARY_SNAPSHOT_KEY)
  } catch {
    // sessionStorage can be unavailable; memory cache remains usable.
  }
}

function isSnapshotShape(snapshot) {
  return (
    snapshot &&
    typeof snapshot === 'object' &&
    !Array.isArray(snapshot) &&
    snapshot.version === LIBRARY_SNAPSHOT_VERSION &&
    finiteNumber(snapshot.savedAt) &&
    Array.isArray(snapshot.data)
  )
}

function readSnapshot() {
  try {
    const raw = window.sessionStorage.getItem(LIBRARY_SNAPSHOT_KEY)
    if (!raw) return null

    const snapshot = JSON.parse(raw)
    const age = Date.now() - snapshot?.savedAt

    if (!isSnapshotShape(snapshot) || age < 0 || age > LIBRARY_SNAPSHOT_TTL_MS) {
      removeSnapshot()
      return null
    }

    return sanitizeArticles(snapshot.data)
  } catch {
    removeSnapshot()
    return null
  }
}

function writeSnapshot(articles) {
  try {
    window.sessionStorage.setItem(
      LIBRARY_SNAPSHOT_KEY,
      JSON.stringify({
        version: LIBRARY_SNAPSHOT_VERSION,
        savedAt: Date.now(),
        data: sanitizeArticles(articles),
      })
    )
  } catch {
    // sessionStorage quota/security errors must not block Library.
  }
}

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

export function peekArticlesSnapshot() {
  return readSnapshot()
}

export async function fetchArticles({ force = false } = {}) {
  const cached = freshEntry()

  if (!force && cached) {
    return cached.data
  }

  if (inFlight.has(CACHE_KEY)) {
    return inFlight.get(CACHE_KEY)
  }

  const request = api.articles
    .list()
    .then(data => {
      cache.set(CACHE_KEY, { data, fetchedAt: Date.now() })
      writeSnapshot(data)

      return data
    })
    .finally(() => {
      inFlight.delete(CACHE_KEY)
    })

  inFlight.set(CACHE_KEY, request)

  return request
}

export function invalidateArticles() {
  cache.delete(CACHE_KEY)
}
