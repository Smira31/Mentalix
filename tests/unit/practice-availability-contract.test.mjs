import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/config/practiceAvailability.js', import.meta.url),
  'utf8'
)

test('MXL-525: brain/breathing доступны, Focus закрыт до пересмотра дизайна', () => {
  assert.match(source, /PRACTICE_KEYS\.brain,\s*\n\s*PRACTICE_KEYS\.breathing,/)
  assert.doesNotMatch(source, /PRACTICE_KEYS\.breathing,[\s\S]*PRACTICE_KEYS\.focus,\s*\n\s*\]\)/)
})
