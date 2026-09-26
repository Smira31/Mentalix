import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  DEFAULT_REVIEW_HOUR,
  formatReviewTime,
  resolveTodayCardStates,
} from '../../src/lib/todayCardState.js'

function memoryStorage() {
  const map = new Map()
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
  }
}

function freshDemoStorage() {
  globalThis.localStorage = memoryStorage()
  globalThis.sessionStorage = memoryStorage()
}

freshDemoStorage()
const { demoRequest } = await import('../../src/lib/demoMode.js')

const get = path => demoRequest(path, { method: 'GET' })
const post = (path, body) => demoRequest(path, { method: 'POST', body: JSON.stringify(body) })

// Даты — только относительно текущего дня (локальное время).
function todayAt(hour, minute = 0) {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date
}

test('DEFAULT_REVIEW_HOUR экспортирован и равен 19', () => {
  assert.equal(DEFAULT_REVIEW_HOUR, 19)
})

test('formatReviewTime использует DEFAULT_REVIEW_HOUR как дефолт', () => {
  assert.equal(formatReviewTime(), '19:00')
  assert.equal(formatReviewTime(undefined), '19:00')
  assert.equal(formatReviewTime(0), '19:00')
  assert.equal(formatReviewTime(24), '19:00')
  assert.equal(formatReviewTime(DEFAULT_REVIEW_HOUR), '19:00')
})

test('resolveTodayCardStates открывает разбор в DEFAULT_REVIEW_HOUR', () => {
  const before = resolveTodayCardStates({ now: todayAt(DEFAULT_REVIEW_HOUR - 1, 59) })
  assert.equal(before.review, 'locked')
  const at = resolveTodayCardStates({ now: todayAt(DEFAULT_REVIEW_HOUR, 0) })
  assert.equal(at.review, 'active')
})

test('демо: разбор с 19:00 по умолчанию', async () => {
  freshDemoStorage()
  const settings = await get('/profile/settings')
  assert.equal(formatReviewTime(settings.review_hour), '19:00')
})

test('демо: смена review_hour меняет подпись карточки «Сегодня»', async () => {
  freshDemoStorage()
  await post('/profile/settings', { user_id: 900001, review_hour: 21 })
  const updated = await get('/profile/settings')
  assert.equal(formatReviewTime(updated.review_hour), '21:00')
})

test('единый источник: Today.jsx использует DEFAULT_REVIEW_HOUR, а не хардкод 19', async () => {
  const source = await readFile(
    new URL('../../src/screens/Today.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /DEFAULT_REVIEW_HOUR/)
  // Не должно остаться хардкода ?? 19 для review_hour
  assert.doesNotMatch(source, /review_hour\s*\?\?\s*19\b/)
  assert.doesNotMatch(source, /review_hour\s*\?\?\s*19[^0-9]/)
})

test('единый источник: Settings.jsx использует DEFAULT_REVIEW_HOUR и синхронизирует напоминание', async () => {
  const source = await readFile(
    new URL('../../src/screens/Settings.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /DEFAULT_REVIEW_HOUR/)
  // Динамический чип «Вечер» берёт час из reviewHour
  assert.match(source, /label:\s*'Вечер',\s*hour:\s*reviewHour/)
  // Синхронизация: saveReviewHour проверяет wasInSync и пишет reminder_hour
  assert.match(source, /wasInSync/)
  assert.match(source, /payload\.reminder_hour/)
  // Не должно остаться хардкода ?? 19
  assert.doesNotMatch(source, /\?\?\s*19\b(?!:00)/)
})

test('единый источник: todayDataCache.js использует DEFAULT_REVIEW_HOUR', async () => {
  const source = await readFile(
    new URL('../../src/lib/todayDataCache.js', import.meta.url),
    'utf8'
  )
  assert.match(source, /DEFAULT_REVIEW_HOUR/)
  assert.doesNotMatch(source, /review_hour.*:\s*19[^0-9]/)
})

test('единый источник: demoMode.js использует DEFAULT_REVIEW_HOUR', async () => {
  const source = await readFile(
    new URL('../../src/lib/demoMode.js', import.meta.url),
    'utf8'
  )
  assert.match(source, /DEFAULT_REVIEW_HOUR/)
  assert.doesNotMatch(source, /review_hour\s*\?\?\s*19\b/)
})

test('единый источник: Onboarding.jsx задаёт review_hour при онбординге', async () => {
  const source = await readFile(
    new URL('../../src/screens/Onboarding.jsx', import.meta.url),
    'utf8'
  )
  assert.match(source, /DEFAULT_REVIEW_HOUR/)
  assert.match(source, /review_hour:\s*DEFAULT_REVIEW_HOUR/)
})
