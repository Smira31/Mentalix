import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { ARTICLES } from '../../src/data/articles.js'
import {
  fetchArticles,
  peekArticles,
  peekArticlesSnapshot,
  invalidateArticles,
} from '../../src/lib/libraryDataCache.js'

test('Все потребители читают единый ARTICLES, включая старый адаптер', async () => {
  assert.equal(peekArticles(), ARTICLES)
  assert.equal(peekArticlesSnapshot(), ARTICLES)
  assert.equal(await fetchArticles({ force: true }), ARTICLES)
  invalidateArticles()
  assert.equal(await fetchArticles(), ARTICLES)
  const cache = await readFile(
    new URL('../../src/lib/libraryDataCache.js', import.meta.url),
    'utf8'
  )
  assert.doesNotMatch(cache, /api\.articles|sessionStorage/)
})

test('Статья доступна целиком и без сети: текст, источник и вопрос не теряются', () => {
  for (const article of peekArticles()) {
    assert.ok(article.id && article.title && article.body && article.question)
    assert.ok(article.minutes > 0)
  }
  assert.equal(
    peekArticles().find(a => a.id === 'son-kak-uborka').source,
    'https://www.nature.com/articles/s41593-024-01638-y'
  )
})
