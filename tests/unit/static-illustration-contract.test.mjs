import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [glyphSource, glyphCss, stateSource, catalogSource, catalogCss] = await Promise.all([
  readFile(new URL('../../src/components/SemanticGlyph.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/components/SemanticGlyph.css', import.meta.url), 'utf8'),
  readFile(new URL('../../src/components/SystemState.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url), 'utf8'),
  readFile(
    new URL('../../src/components/ui-lab/LayeredPracticeCatalogExperiment.css', import.meta.url),
    'utf8',
  ),
])

test('SemanticGlyph is a single static production illustration registry', () => {
  assert.match(glyphSource, /data-animated="false"/)
  assert.doesNotMatch(glyphSource, /data-animated=\{animated\}/)
  assert.match(glyphCss, /animation: none !important;/)
  assert.match(glyphCss, /transition: none !important;/)
})

test('the registry covers approved cards and shared system states', () => {
  for (const kind of [
    'journal',
    'next-step',
    'purpose',
    'focus',
    'release',
    'breath',
    'meditation',
    'neuro',
    'loading',
    'progress',
    'empty',
    'success',
    'error',
    'onboarding',
  ]) {
    assert.match(glyphSource, new RegExp(`case '${kind}'`))
  }

  assert.match(stateSource, /<SemanticGlyph kind=\{kind\} \/>/)
})

test('production practice cards reserve editorial-scale space for illustrations', () => {
  assert.match(catalogSource, /mx-production-catalog--large-art/)
  assert.match(catalogCss, /\.mx-production-catalog--large-art[\s\S]*flex: 0 0 84%/)
  assert.match(
    catalogCss,
    /\.mx-production-catalog--large-art \.mx-layered-catalog__collections \{\s*grid-template-columns: minmax\(0, 1fr\)/,
  )
  assert.match(catalogCss, /min-height: 300px/)
  assert.match(catalogCss, /\.mx-production-catalog--large-art \.mx-layered-category__art-base \{\s*display: none/)
})
