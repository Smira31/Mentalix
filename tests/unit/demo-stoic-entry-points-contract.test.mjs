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
  // Редизайн карточек дня: заголовок рендерится через классы карточки,
  // а не через <strong>. Две независимые точки входа сохраняются:
  // заголовок (mx-today-day-card__title) и текст завершения (mx-today-day-card__done-text).
  assert.match(today, /mx-today-day-card__title/)
  assert.match(today, /mx-today-day-card__done-text/)
  assert.match(today, /data-testid=\{`today-card-start-\$\{kind\}`\}/)
  assert.doesNotMatch(today, /isPreviewDemoMode\(\)/)
})

test('демо поддерживает ночное состояние', () => {
  assert.match(demo, /'night'/)
  assert.match(today, /cardNow\.setHours\(1, 30, 0, 0\)/)
})

test('Today keeps the main day card before secondary sections', () => {
  const cardsStart = today.indexOf('mx-today-day-card-slot')
  const pulseStart = today.indexOf('mx-today-pulse')
  const thoughtStart = today.indexOf('today-quote-card')
  const practicesStart = today.indexOf('<PinnedPractices')
  const themeStart = today.indexOf('mx-today-weekly-theme')

  assert.notEqual(cardsStart, -1)
  assert.notEqual(themeStart, -1)
  assert.ok(cardsStart < pulseStart, 'чек-ины раньше пульса')
  assert.ok(pulseStart < thoughtStart, 'пульс раньше Мысли дня')
  assert.ok(thoughtStart < practicesStart, 'Мысль дня раньше Твоих практик')
  assert.ok(practicesStart < themeStart, 'Твои практики раньше Темы недели')
})

console.log('Demo Stoic entry-point contract passed')
