import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/config/practiceAvailability.js', import.meta.url),
  'utf8'
)

test('MXL-525 (G6): brain/breathing/focus признаны доступными', () => {
  assert.match(source, /PRACTICE_KEYS\.brain,\s*\n\s*PRACTICE_KEYS\.breathing,\s*\n\s*PRACTICE_KEYS\.focus/)
})
