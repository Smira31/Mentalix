import { libraryTopic } from '../data/libraryTopics.js'
import { ARTICLES } from '../data/articles.js'

// Единственный опубликованный каталог. Не зависит от сети, API и устаревших снимков.
export const libraryArticles = ARTICLES

export function articleSections(articles = libraryArticles) {
  // Группируем по резолвнутому заголовку темы: теги «путь-героя» и «кризис»
  // оба resolve-ятся в «Кризис и рост» и попадают в один раздел.
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

export function nextArticle(article, sections = articleSections()) {
  const ordered = sections.flatMap(section => section.articles)
  const index = ordered.findIndex(item => item.id === article.id)
  return ordered.length > 1 ? ordered[(index + 1) % ordered.length] : null
}
