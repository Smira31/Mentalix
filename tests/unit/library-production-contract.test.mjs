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

test('MXL-526 сохраняет честные границы функций', () => {
  assert.match(library, /title="Практикумы"/)
  assert.match(library, /soon/)
  assert.match(library, /СКОРО/)
  assert.match(articles, /initialArticle = null, onExit/)
  assert.match(journals, /GuidedJournals\(\{ user, onExit \}\)/)
  assert.match(journals, /platformName === 'telegram'/)
})

test('MXL-526 использует изолированный свайп-rail без document touch handlers', () => {
  assert.match(styles, /\.mx-library-catalog__rail/)
  assert.match(styles, /scroll-snap-type:\s*x mandatory/)
  assert.match(styles, /overflow-x:\s*auto/)
  assert.doesNotMatch(library, /touchstart|touchmove|touchend/)
  assert.doesNotMatch(styles, /transition:\s*all/)
})
