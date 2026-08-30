import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const today = readFileSync(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

test('contextual actions open only the existing allowlisted screens', () => {
  assert.match(app, /initialAction === 'breathing' \? 'practices' : 'today'/)
  assert.match(app, /initialAction === 'checkin' \|\| initialAction === 'evening' \? initialAction : null/)
  assert.match(app, /initialSub=\{initialTodaySub\}/)
  assert.match(app, /initialAction === 'breathing' \? 'breathing' : null/)
  assert.doesNotMatch(app, /initialAction.*window\.location\.href/)
})

test('Today accepts a contextual initial sub-route and uses the existing Check-in screen', () => {
  assert.match(today, /initialSub = null/)
  assert.match(today, /useState\(initialSub\)/)
  assert.match(today, /if \(sub === 'checkin'\)/)
  assert.match(today, /<CheckIn/)
  assert.match(today, /initialSub === 'evening'/)
})
