import test from 'node:test'
import assert from 'node:assert/strict'
import { formatReviewTime, resolveTodayCardStates } from '../../src/lib/todayCardState.js'

const at = (iso, timeZone) =>
  resolveTodayCardStates({ now: new Date(iso), reviewHour: 19, timeZone })

test('утро доступно весь день — нет состояния missed', () => {
  // Утро теперь доступно весь день (active), пока не пройдено.
  // Состояния 'missed' для сегодняшних карточек нет.
  assert.deepEqual(at('2026-09-23T01:59:00Z', 'Europe/Moscow'), {
    morning: 'active',
    review: 'active',
    hour: 4,
    minute: 59,
    isNight: true,
  })
  assert.deepEqual(at('2026-09-23T02:00:00Z', 'Europe/Moscow'), {
    morning: 'active',
    review: 'locked',
    hour: 5,
    minute: 0,
    isNight: false,
  })
})

test('разбор открывается ровно в 19:00', () => {
  assert.equal(at('2026-09-23T15:59:00Z', 'Europe/Moscow').review, 'locked')
  assert.equal(at('2026-09-23T16:00:00Z', 'Europe/Moscow').review, 'active')
})

test('настройка времени разбора 21:00', () => {
  const before = resolveTodayCardStates({
    now: new Date('2026-09-23T17:00:00Z'),
    reviewHour: 21,
    timeZone: 'Europe/Moscow',
  })
  const after = resolveTodayCardStates({
    now: new Date('2026-09-23T19:00:00Z'),
    reviewHour: 21,
    timeZone: 'Europe/Moscow',
  })
  assert.equal(before.review, 'locked')
  assert.equal(after.review, 'active')
})

test('done независимы для утра и разбора', () => {
  // Утро «пройдено» по утренним полям (mood/energy/note), а не по пустому чекину.
  const states = resolveTodayCardStates({
    now: new Date('2026-09-23T16:00:00Z'),
    reviewHour: 19,
    timeZone: 'Europe/Moscow',
    checkin: { mood: 3 },
  })
  assert.deepEqual(states, {
    morning: 'done',
    review: 'active',
    hour: 19,
    minute: 0,
    isNight: false,
  })
  // Разбор «пройден» по review_completed_at — утро при этом остаётся active, если утренних полей нет.
  assert.equal(
    resolveTodayCardStates({
      now: new Date('2026-09-23T16:00:00Z'),
      reviewHour: 19,
      timeZone: 'Europe/Moscow',
      checkin: { review_completed_at: '2026-09-23T16:01:00Z' },
    }).review,
    'done'
  )
  assert.equal(
    resolveTodayCardStates({
      now: new Date('2026-09-23T16:00:00Z'),
      reviewHour: 19,
      timeZone: 'Europe/Moscow',
      checkin: { review_completed_at: '2026-09-23T16:01:00Z' },
    }).morning,
    'active'
  )
})

test('ночной текст действует с 00:00 до 04:59 по локальному времени', () => {
  const cases = [
    ['2026-09-23T20:59:00Z', false], // 23:59
    ['2026-09-23T21:00:00Z', true], // 00:00
    ['2026-09-24T01:59:00Z', true], // 04:59
    ['2026-09-24T02:00:00Z', false], // 05:00
  ]
  for (const [iso, isNight] of cases) {
    const state = at(iso, 'Europe/Moscow')
    assert.equal(state.isNight, isNight)
    assert.equal(state.morning, 'active')
    assert.equal(state.review, isNight || !iso.endsWith('02:00:00Z') ? 'active' : 'locked')
  }
})

test('форматирует время настройки', () => {
  assert.equal(formatReviewTime(19), '19:00')
  assert.equal(formatReviewTime(21), '21:00')
})
