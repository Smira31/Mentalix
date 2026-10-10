import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { ARTICLES } from '../../src/data/articles.js'
import { libraryArticles } from '../../src/lib/libraryArticles.js'
import {
  fetchArticles,
  peekArticles,
  peekArticlesSnapshot,
  invalidateArticles,
} from '../../src/lib/libraryDataCache.js'

// Каталог для потребителей — отфильтрованный (hidden-статьи удалены),
// но это один и тот же массив: без сети, копий и API-снимков.
test('Все потребители читают единый каталог, включая старый адаптер', async () => {
  assert.equal(peekArticles(), libraryArticles)
  assert.equal(peekArticlesSnapshot(), libraryArticles)
  assert.equal(await fetchArticles({ force: true }), libraryArticles)
  invalidateArticles()
  assert.equal(await fetchArticles(), libraryArticles)
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

test('Скрытые статьи отфильтрованы в каталоге, тексты остаются в файле', async () => {
  const hiddenIds = [
    'put-geroya-zachem-krizis',
    'ispytaniya-sovremennogo-cheloveka',
    'ten-i-persona-chto-pryachem',
    'samost-tochka-opory-vnutri',
    'vozrastnye-krizisy-chernovik-konchaetsya',
    'ii-i-samost-pochemu-mashina-ne-zamenit',
  ]
  for (const id of hiddenIds) {
    assert.equal(peekArticles().some(a => a.id === id), false, id)
    const source = ARTICLES.find(a => a.id === id)
    assert.ok(source && source.hidden && source.body.length > 100, id)
  }
})
