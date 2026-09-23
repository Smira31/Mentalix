import test from 'node:test'
import assert from 'node:assert/strict'
import { formatReviewTime, resolveTodayCardStates } from '../../src/lib/todayCardState.js'

const at = (iso, timeZone) => resolveTodayCardStates({ now: new Date(iso), reviewHour: 19, timeZone })

test('карточки меняются в 04:59 и 05:00', () => {
  assert.deepEqual(at('2026-09-23T01:59:00Z', 'Europe/Moscow'), { morning: 'missed', review: 'locked', hour: 4, minute: 59 })
  assert.deepEqual(at('2026-09-23T02:00:00Z', 'Europe/Moscow'), { morning: 'active', review: 'locked', hour: 5, minute: 0 })
})

test('разбор открывается ровно в 19:00', () => {
  assert.equal(at('2026-09-23T15:59:00Z', 'Europe/Moscow').review, 'locked')
  assert.equal(at('2026-09-23T16:00:00Z', 'Europe/Moscow').review, 'active')
})

test('настройка времени разбора 21:00', () => {
  const before = resolveTodayCardStates({ now: new Date('2026-09-23T17:00:00Z'), reviewHour: 21, timeZone: 'Europe/Moscow' })
  const after = resolveTodayCardStates({ now: new Date('2026-09-23T19:00:00Z'), reviewHour: 21, timeZone: 'Europe/Moscow' })
  assert.equal(before.review, 'locked')
  assert.equal(after.review, 'active')
})

test('done независимы для утра и разбора', () => {
  const states = resolveTodayCardStates({ now: new Date('2026-09-23T16:00:00Z'), reviewHour: 19, timeZone: 'Europe/Moscow', checkin: {} })
  assert.deepEqual(states, { morning: 'done', review: 'active', hour: 19, minute: 0 })
  assert.equal(resolveTodayCardStates({ now: new Date('2026-09-23T16:00:00Z'), reviewHour: 19, timeZone: 'Europe/Moscow', checkin: { review_completed_at: '2026-09-23T16:01:00Z' } }).review, 'done')
})

test('форматирует время настройки', () => {
  assert.equal(formatReviewTime(19), '19:00')
  assert.equal(formatReviewTime(21), '21:00')
})
