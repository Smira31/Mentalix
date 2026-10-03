import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { articleSections, libraryArticles, nextArticle } from '../../src/lib/libraryArticles.js'

const source = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const library = source('src/screens/Library.jsx')

test('Библиотека использует общий баннер и не монтирует направленные записи', () => {
  assert.match(library, /<CourseCards/)
  assert.match(source('src/components/CourseCard.jsx'), /<StepsJournalBanner/)
  assert.match(source('src/components/PracticeCatalogV2.jsx'), /<StepsJournalBanner/)
  assert.doesNotMatch(library, /GuidedJournals|<Articles|ArticleCover/)
  assert.match(source('src/screens/LibraryPrograms.jsx'), /LIBRARY_PROGRAMS_ENABLED = false/)
  assert.match(library, /LIBRARY_PROGRAMS_ENABLED &&/)
})

test('Разделы минимум по две статьи, маленькие темы — в конце', () => {
  const sections = articleSections()
  assert.deepEqual(
    sections.map(s => s.topic),
    ['Путь героя', 'Юнг', 'Ещё почитать']
  )
  assert.deepEqual(
    sections.map(s => s.articles.length),
    [2, 2, 4]
  )
  assert.equal(articleSections([]).length, 0)
  const ordered = sections.flatMap(s => s.articles)
  assert.equal(new Set(ordered.map(a => a.id)).size, libraryArticles.length)
  for (let i = 0; i < ordered.length; i++)
    assert.equal(nextArticle(ordered[i]).id, ordered[(i + 1) % ordered.length].id)
  assert.equal(nextArticle({ id: 'only' }, [{ articles: [{ id: 'only' }] }]), null)
})

test('У каждой статьи ровно один короткий вопрос без возраста, денег и ИИ', () => {
  for (const article of libraryArticles) {
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
  assert.match(reader, /Следующая статья →/)
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
