import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const today = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

test('Today uses the completed check-in as the recap entry point', () => {
  assert.match(today, /const checkinDone = !!checkin/)
  assert.match(today, /Открыть recap сегодняшнего check-in/)
  assert.match(today, /changeSub\('checkinRecap'\)/)
  assert.match(today, /настроение: \{MOOD_WORDS\[\(checkin\?\.mood \|\| 3\) - 1\]\}/)
  assert.doesNotMatch(today, /isPreviewDemoMode\(\)/)
})

test('Today keeps the check-in hero before secondary sections', () => {
  const heroStart = today.indexOf('const heroCheckinContent')
  const secondaryStart = today.indexOf('mx-today-hero-breath')

  assert.notEqual(heroStart, -1)
  assert.notEqual(secondaryStart, -1)
  assert.ok(heroStart < secondaryStart)
})

console.log('Demo Stoic entry-point contract passed')
