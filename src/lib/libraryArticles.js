import { libraryTopic } from '../data/libraryTopics.js'
import { ARTICLES } from '../data/articles.js'

// Единственный опубликованный каталог. Не зависит от сети, API и устаревших снимков.
export const libraryArticles = ARTICLES

export function articleSections(articles = libraryArticles) {
  const groups = new Map()
  for (const article of articles) {
    const topic = article.tag || article.category || ''
    if (!groups.has(topic)) groups.set(topic, [])
    groups.get(topic).push(article)
  }
  const sections = []
  const rest = []
  for (const [topic, items] of groups) {
    if (topic && items.length >= 2)
      sections.push({ ...libraryTopic(topic), topic: libraryTopic(topic).title, articles: items })
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
