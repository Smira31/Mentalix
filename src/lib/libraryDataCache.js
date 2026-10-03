import { libraryArticles } from './libraryArticles.js'

// Совместимый адаптер старых потребителей: тот же опубликованный каталог,
// без второго источника /articles и устаревших API-снимков.
export function peekArticles() {
  return libraryArticles
}
export function peekArticlesSnapshot() {
  return libraryArticles
}
export async function fetchArticles() {
  return libraryArticles
}
export function invalidateArticles() {
  /* Статический каталог меняется только с релизом. */
}
