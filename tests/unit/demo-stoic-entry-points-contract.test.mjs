import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const today = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const demo = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')

test('Today keeps independent morning and review card entry points', () => {
  assert.match(today, /resolveTodayCardStates/)
  assert.match(today, /renderDayCard\('morning'\)/)
  assert.match(today, /renderDayCard\('evening'\)/)
  assert.match(today, /checkinRecap/)
  assert.doesNotMatch(today, /mx-today-day-card__pill|cardStart2x|cardStart3x/)
  assert.match(today, /cardStates\.isNight/)
  assert.match(today, /<strong>\{titleEmphasis\}<\/strong>/)
  assert.match(today, /data-testid=\{`today-card-start-\$\{kind\}`\}/)
  assert.doesNotMatch(today, /isPreviewDemoMode\(\)/)
})

test('демо поддерживает ночное состояние', () => {
  assert.match(demo, /'night'/)
  assert.match(today, /cardNow\.setHours\(1, 30, 0, 0\)/)
})

test('Today keeps the main day card before secondary sections', () => {
  const cardsStart = today.indexOf('mx-today-day-card-slot')
  const secondaryStart = today.indexOf('mx-today-theme-card')

  assert.notEqual(cardsStart, -1)
  assert.notEqual(secondaryStart, -1)
  assert.ok(cardsStart < secondaryStart)
})

console.log('Demo Stoic entry-point contract passed')
