import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { DEMO_ARTICLES } from '../../src/data/demoContent.js'
import { loadLibraryDataCache } from './helpers/load-library-data-cache.mjs'

const source = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const library = source('src/screens/Library.jsx')

const { articleSectionsFromList, nextArticleFromList } = await loadLibraryDataCache({ demo: true })

test('Библиотека использует общий баннер и не монтирует направленные записи', () => {
  assert.match(library, /<CourseCards/)
  assert.match(source('src/components/CourseCard.jsx'), /<StepsJournalBanner/)
  assert.match(source('src/components/PracticeCatalogV2.jsx'), /<StepsJournalBanner/)
  assert.doesNotMatch(library, /GuidedJournals|<Articles|ArticleCover/)
  assert.match(source('src/screens/LibraryPrograms.jsx'), /LIBRARY_PROGRAMS_ENABLED = false/)
  assert.match(library, /LIBRARY_PROGRAMS_ENABLED &&/)
})

test('Скрытые статьи не показываются: ни в разделах, ни в переходах', () => {
  const hiddenIds = [
    'put-geroya-zachem-krizis',
    'ispytaniya-sovremennogo-cheloveka',
    'ten-i-persona-chto-pryachem',
    'samost-tochka-opory-vnutri',
    'vozrastnye-krizisy-chernovik-konchaetsya',
    'ii-i-samost-pochemu-mashina-ne-zamenit',
  ]
  const sections = articleSectionsFromList(DEMO_ARTICLES)
  const shown = new Set(sections.flatMap(s => s.articles.map(a => a.id)))
  for (const id of hiddenIds) {
    assert.equal(DEMO_ARTICLES.some(a => a.id === id), false, id)
    assert.equal(shown.has(id), false, id)
  }
  // Видимыми остаются «Тревога…» (тревога) и «Сон…» (сон) — по одной статье
  // на тему, поэтому секции ≥2 статей не собираются и обе уходят в «Ещё почитать».
  assert.deepEqual(
    sections.map(s => s.topic),
    ['Ещё почитать']
  )
  assert.deepEqual(
    sections.map(s => s.articles.length),
    [2]
  )
})

test('Разделы минимум по две статьи, маленькие темы — в конце', () => {
  assert.equal(articleSectionsFromList([]).length, 0)
  const list = [
    { id: 'a', tag: 'сон' },
    { id: 'b', tag: 'сон' },
    { id: 'c', tag: 'тревога' },
  ]
  const sections = articleSectionsFromList(list)
  assert.deepEqual(
    sections.map(s => s.topic),
    ['Сон', 'Ещё почитать']
  )
  assert.deepEqual(
    sections.map(s => s.articles.map(a => a.id)),
    [['a', 'b'], ['c']]
  )
  const ordered = sections.flatMap(s => s.articles)
  assert.equal(new Set(ordered.map(a => a.id)).size, list.length)
  for (let i = 0; i < ordered.length; i++)
    assert.equal(nextArticleFromList(ordered[i], list).id, ordered[(i + 1) % ordered.length].id)
  assert.equal(nextArticleFromList({ id: 'only' }, [{ id: 'only' }]), null)
})

test('У каждой статьи ровно один короткий вопрос без возраста, денег и ИИ', () => {
  for (const article of DEMO_ARTICLES) {
    assert.equal((article.question.match(/\?/g) || []).length, 1)
    assert.ok(article.question.length < 100)
    assert.doesNotMatch(article.question, /возраст|деньг|\bИИ\b|\d/i)
    assert.ok(article.body.length > 100)
  }
})

test('Шторка использует Screen, общий свайп и затемнение; читалка — без иллюстрации', () => {
  const sheet = source('src/components/ArticleSheet.jsx')
  const reader = source('src/screens/LibraryArticleReader.jsx')
  assert.match(sheet, /<Screen/)
  assert.match(sheet, /useSheetSwipeDown/)
  assert.match(sheet, /article-sheet-backdrop/)
  assert.match(reader, /А у тебя как\?/)
  assert.match(reader, /Следующая статья/)
  assert.doesNotMatch(reader, /ArticleCover|SemanticGlyph|Поделиться|Избранное/)
  assert.doesNotMatch(source('src/screens/LibraryStoic.css'), /font-serif|transition:\s*all/)
})

test('Устаревшие адреса статей, программ и направленных записей перенаправляются, журнал Шагов — нет', async () => {
  const { isRemovedLibraryAddress } = await import('../../src/lib/libraryNavigation.js')
  for (const path of [
    '/?tab=articles',
    '/?tab=library&sub=journals',
    '/?tab=library&screen=library-v2-program',
    '/library/articles',
    '/journals/archive',
    '/library/guided-journals/builder',
    '/?tab=library&action=programs',
  ]) {
    assert.equal(isRemovedLibraryAddress(new URL(path, 'https://example.test')), true, path)
  }
  assert.equal(
    isRemovedLibraryAddress(new URL('https://example.test/?tab=practices&sub=journal')),
    false
  )
  assert.equal(
    isRemovedLibraryAddress(new URL('https://example.test/?tab=library&action=hero_journey')),
    false
  )
})
