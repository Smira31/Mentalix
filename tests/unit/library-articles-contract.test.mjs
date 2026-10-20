import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { DEMO_ARTICLES } from '../../src/data/demoContent.js'
import {
  loadLibraryDataCache,
  libraryDataCacheSource,
} from './helpers/load-library-data-cache.mjs'

const source = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

/*
 * Каталог статей приезжает с сервера (#1112, этап 3):
 *   GET /api/content/library       — список без body
 *   GET /api/content/library/{id}  — статья целиком
 * В бандле остаются только две демо-статьи для ?demo=1.
 */
test('Список и текст статьи запрашиваются у сервера; статический каталог пуст', async () => {
  assert.match(libraryDataCacheSource, /api\.content\s*\.\s*library\(\)/)
  assert.match(libraryDataCacheSource, /api\.content\.libraryArticle\(id\)/)
  assert.doesNotMatch(libraryDataCacheSource, /sessionStorage/)
  const api = await source('src/lib/api.js')
  assert.match(api, /library: \(\) => request\('\/content\/library'\)/)
  assert.match(api, /libraryArticle: id => request\(`\/content\/library\/\$\{id\}`\)/)
  assert.match(api, /heroJourney: \(\) => request\('\/content\/hero-journey'\)/)
  // Тексты статей из бандла убраны: публикуемый каталог пуст.
  const articles = await source('src/data/articles.js')
  assert.match(articles, /export const ARTICLES = \[\]/)
  assert.doesNotMatch(articles, /body:/)
})

test('Демо-каталог: две видимые статьи, тексты и источники на месте', () => {
  assert.deepEqual(
    DEMO_ARTICLES.map(a => a.id),
    ['trevoga-ranshe-povoda', 'son-kak-uborka']
  )
  for (const article of DEMO_ARTICLES) {
    assert.ok(article.id && article.title && article.body && article.question)
    assert.ok(article.minutes > 0)
    assert.ok(article.body.length > 100)
    assert.equal(article.hidden, undefined)
  }
  assert.equal(
    DEMO_ARTICLES.find(a => a.id === 'son-kak-uborka').source,
    'https://www.nature.com/articles/s41593-024-01638-y'
  )
})

test('Скрытые статьи отфильтрованы: их нет ни в демо-каталоге, ни в бандле', async () => {
  const hiddenIds = [
    'put-geroya-zachem-krizis',
    'ispytaniya-sovremennogo-cheloveka',
    'ten-i-persona-chto-pryachem',
    'samost-tochka-opory-vnutri',
    'vozrastnye-krizisy-chernovik-konchaetsya',
    'ii-i-samost-pochemu-mashina-ne-zamenit',
  ]
  const articles = await source('src/data/articles.js')
  for (const id of hiddenIds) {
    assert.equal(DEMO_ARTICLES.some(a => a.id === id), false, id)
    assert.doesNotMatch(articles, new RegExp(id), id)
  }
  // Сам фильтр проверяется на подменённом демо-каталоге.
  const demo = await loadLibraryDataCache({
    demo: true,
    demoArticles: [
      { id: 'visible', title: 'Видимая', minutes: 1 },
      { id: 'hidden-one', title: 'Скрытая', minutes: 1, hidden: true },
    ],
  })
  assert.deepEqual(
    (await demo.fetchArticles()).map(a => a.id),
    ['visible']
  )
  assert.deepEqual(
    demo.peekArticles().map(a => a.id),
    ['visible']
  )
})

test('Разделы: по одной статье на тему — обе уходят в «Ещё почитать»', async () => {
  const { articleSectionsFromList } = await loadLibraryDataCache({ demo: true })
  const sections = articleSectionsFromList(DEMO_ARTICLES)
  assert.deepEqual(
    sections.map(s => s.topic),
    ['Ещё почитать']
  )
  assert.deepEqual(
    sections.map(s => s.articles.length),
    [2]
  )
})

test('Переход к следующей статье идёт по кругу; одна статья — перехода нет', async () => {
  const { nextArticleFromList } = await loadLibraryDataCache({ demo: true })
  assert.equal(nextArticleFromList(DEMO_ARTICLES[0], DEMO_ARTICLES).id, DEMO_ARTICLES[1].id)
  assert.equal(nextArticleFromList(DEMO_ARTICLES[1], DEMO_ARTICLES).id, DEMO_ARTICLES[0].id)
  assert.equal(nextArticleFromList({ id: 'only' }, [{ id: 'only' }]), null)
})

test('Совместимый адаптер делегирует серверному кешу и статики не держит', async () => {
  const adapter = await source('src/lib/libraryArticles.js')
  assert.match(adapter, /from '\.\/libraryDataCache\.js'/)
  assert.match(adapter, /fetchArticles/)
  assert.match(adapter, /peekArticles/)
  assert.doesNotMatch(adapter, /from '\.\.\/data\/articles/)
})
