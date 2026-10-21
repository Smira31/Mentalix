/**
 * Совместимый адаптер: articleSections и nextArticle теперь работают
 * на данных, загруженных с сервера (src/lib/libraryDataCache.js).
 *
 * Статический каталог (ARTICLES) пуст — тексты статей приходят с сервера.
 */
import {
  articleSectionsFromList,
  nextArticleFromList,
  fetchArticles,
  peekArticles,
} from './libraryDataCache.js'

export async function loadArticleSections() {
  const articles = await fetchArticles()
  return articleSectionsFromList(articles)
}

export function articleSections(articles = null) {
  if (articles) return articleSectionsFromList(articles)
  // Синхронный доступ к кешу (если уже загружен)
  const cached = peekArticles()
  return cached ? articleSectionsFromList(cached) : []
}

export function nextArticle(article, articles = null) {
  const list = articles || peekArticles() || []
  return nextArticleFromList(article, list)
}
