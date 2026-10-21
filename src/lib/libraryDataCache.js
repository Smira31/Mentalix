/**
 * Кеш статей Библиотеки — загружает список с сервера (#1112, этап 3).
 *
 * GET /api/content/library → список статей без body (id, title, excerpt,
 * minutes, date, tag?, source?, question?), новые сверху.
 *
 * Данные кешируются на сессию. В демо-режиме — встроенные демо-статьи
 * (src/data/demoContent.js, DEMO_ARTICLES).
 */
import { api } from './api'
import { isPreviewDemoMode } from './demoMode'
import { DEMO_ARTICLES } from '../data/demoContent'
import { libraryTopic } from '../data/libraryTopics'

let cachedArticles = null
let cachedPromise = null

function visibleArticles(list) {
  return (list || []).filter(a => !a.hidden)
}

export function peekArticles() {
  if (isPreviewDemoMode()) return visibleArticles(DEMO_ARTICLES)
  return cachedArticles
}

export function peekArticlesSnapshot() {
  return peekArticles()
}

export async function fetchArticles({ force = false } = {}) {
  if (isPreviewDemoMode()) return visibleArticles(DEMO_ARTICLES)
  if (cachedArticles && !force) return cachedArticles
  if (cachedPromise && !force) return cachedPromise

  cachedPromise = api.content
    .library()
    .then(data => {
      cachedArticles = visibleArticles(data)
      return cachedArticles
    })
    .finally(() => {
      cachedPromise = null
    })

  return cachedPromise
}

export function invalidateArticles() {
  cachedArticles = null
  cachedPromise = null
}

/**
 * Загружает статью целиком (с body) по id.
 * В демо-режиме ищет в DEMO_ARTICLES.
 */
export async function fetchArticleById(id) {
  if (isPreviewDemoMode()) {
    return DEMO_ARTICLES.find(a => a.id === id) || null
  }
  return api.content.libraryArticle(id)
}

/**
 * Группирует статьи по темам (тегам) — как articleSections из libraryArticles.js,
 * но работает на загруженных с сервера данных.
 */
export function articleSectionsFromList(articles = []) {
  const groups = new Map()
  for (const article of articles) {
    const tag = article.tag || article.category || ''
    const resolved = libraryTopic(tag)
    if (!groups.has(resolved.title))
      groups.set(resolved.title, { topic: resolved.title, image: resolved.image, articles: [] })
    groups.get(resolved.title).articles.push(article)
  }
  const sections = []
  const rest = []
  for (const [title, { topic, image, articles: items }] of groups) {
    if (title && title !== 'Ещё почитать' && items.length >= 2)
      sections.push({ topic, image, articles: items })
    else rest.push(...items)
  }
  if (rest.length) sections.push({ ...libraryTopic('rest'), topic: 'Ещё почитать', articles: rest })
  return sections
}

export function nextArticleFromList(article, articles = []) {
  const sections = articleSectionsFromList(articles)
  const ordered = sections.flatMap(section => section.articles)
  const index = ordered.findIndex(item => item.id === article.id)
  return ordered.length > 1 ? ordered[(index + 1) % ordered.length] : null
}
