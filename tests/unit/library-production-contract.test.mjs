import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const library = readFileSync(new URL('../../src/screens/Library.jsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../../src/screens/Library.css', import.meta.url), 'utf8')
const articles = readFileSync(new URL('../../src/screens/Articles.jsx', import.meta.url), 'utf8')
const journals = readFileSync(
  new URL('../../src/screens/GuidedJournals.jsx', import.meta.url),
  'utf8'
)

test('MXL-526 переносит одобренную композицию Библиотеки на реальные данные', () => {
  assert.match(library, /fetchArticles/)
  assert.match(library, /<Articles/)
  assert.match(library, /<GuidedJournals/)
  assert.match(library, /onOpenArticle/)
  assert.doesNotMatch(library, /LibraryExperiment/)
  assert.doesNotMatch(library, /Courses/)
})

test('MXL-661 production Library использует demo-порядок секций без demo-флага', () => {
  assert.match(library, /const LIBRARY_V2_ENABLED = true/)
  const programs = library.indexOf('<LibraryV2ProgramLanding')
  const articlesSection = library.indexOf('<LibraryV2ArticleLanding')
  const journals = library.indexOf('<LibraryV2JournalLanding')
  assert.ok(programs >= 0 && programs < articlesSection && articlesSection < journals)
  assert.match(library, /fetchArticles/)
  assert.match(library, /ARTICLES\[0\]/)
})

test('MXL-526 сохраняет честные границы функций', () => {
  assert.match(library, /title="Практикумы"/)
  assert.match(library, /soon/)
  assert.match(library, /СКОРО/)
  assert.match(articles, /initialArticle = null, onExit/)
  assert.match(articles, /ArticlesCollectionHeader onExit=\{onExit\}/)
  assert.match(journals, /GuidedJournals\(\{[^}]*\buser\b[^}]*\bonExit\b[^}]*\}\)/)
  assert.match(journals, /platformName === 'telegram'/)
})

test('MXL-526 использует изолированный свайп-rail без document touch handlers', () => {
  assert.match(styles, /\.mx-library-catalog__rail/)
  assert.match(styles, /scroll-snap-type:\s*x mandatory/)
  assert.match(styles, /overflow-x:\s*auto/)
  assert.doesNotMatch(library, /touchstart|touchmove|touchend/)
  assert.doesNotMatch(styles, /transition:\s*all/)
})
