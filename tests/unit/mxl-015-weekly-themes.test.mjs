import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('MXL-015 публикует 14 curated Stoic-inspired тем без backend предположений', () => {
  const source = readFileSync(new URL('../../src/data/weeklyThemes.js', import.meta.url), 'utf8')

  assert.match(source, /export const WEEKLY_THEME_CATALOG = \[/)
  assert.equal((source.match(/key: '/g) || []).length, 14)
  assert.match(source, /control-and-influence/)
  assert.match(source, /attention/)
  assert.match(source, /friction/)
  assert.match(source, /courage/)
  assert.match(source, /temperance/)
  assert.match(source, /perspective/)
  assert.match(source, /renewal/)
  assert.match(source, /uncertainty/)
  assert.match(source, /temporality/)
  assert.match(source, /loneliness/)
  assert.match(source, /meaning/)
  assert.match(source, /mirror/)
  assert.match(source, /comparison/)
  assert.match(source, /self-assembly/)
  assert.equal((source.match(/stoicQuestion:/g) || []).length, 14)
  assert.equal((source.match(/actionPrompt:/g) || []).length, 14)
  assert.equal((source.match(/analysisPrompt:/g) || []).length, 14)
  assert.equal((source.match(/nextStepPrompt:/g) || []).length, 14)
  assert.match(source, /Backend theme IDs, publication, and reflection persistence remain/)
})
