import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [glyphSource, glyphCss, stateSource] = await Promise.all([
  readFile(new URL('../../src/components/SemanticGlyph.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/components/SemanticGlyph.css', import.meta.url), 'utf8'),
  readFile(new URL('../../src/components/SystemState.jsx', import.meta.url), 'utf8'),
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
