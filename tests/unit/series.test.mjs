import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildSeriesViewModel,
  currentCheckinStreak,
  longestCheckinStreak,
  collectActivityDays,
} from '../../src/lib/series.js'

test('currentCheckinStreak counts the completed tail in chronological order', () => {
  const checkins = [
    { date: '2026-08-26', review_completed_at: '2026-08-26T20:00:00Z' },
    { date: '2026-08-28', review_completed_at: '2026-08-28T20:00:00Z' },
    { date: '2026-08-27', review_completed_at: '2026-08-27T20:00:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins), 3)
})

test('currentCheckinStreak counts morning-only check-ins (date without review_completed_at)', () => {
  const checkins = [
    { date: '2026-08-25', review_completed_at: '2026-08-25T20:00:00Z' },
    { date: '2026-08-26', review_completed_at: null },
    { date: '2026-08-27', review_completed_at: '2026-08-27T20:00:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins), 3)
})

test('currentCheckinStreak ignores records without a date or completion marker', () => {
  const checkins = [
    { date: '2026-08-25', review_completed_at: '2026-08-25T20:00:00Z' },
    { review_completed_at: null },
    { date: '2026-08-27', review_completed_at: '2026-08-27T20:00:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins), 1)
})

test('buildSeriesViewModel keeps badges derived from existing stats and practice lists', () => {
  const model = buildSeriesViewModel({
    stats: { total_checkins: 5, days_active: 7, best_streak: 4 },
    checkins: [{ date: '2026-08-28', review_completed_at: '2026-08-28T20:00:00Z' }],
    rituals: [{ streak: 7 }],
    ascezas: [{ streak: 2 }],
  })

  assert.equal(model.currentStreak, 1)
  assert.equal(model.bestStreak, 1)
  assert.equal(model.totalCheckins, 1)
  assert.equal(model.activeDays, 1)
  assert.equal(model.badges.length, 6)
  assert.equal(model.badges.find(badge => badge.id === 'voice-heard').done, false)
  assert.equal(model.badges.find(badge => badge.id === 'ritual-holds').done, true)
})

test('buildSeriesViewModel is safe for empty API responses', () => {
  const model = buildSeriesViewModel({})

  assert.equal(model.currentStreak, 0)
  assert.equal(model.badges.length, 6)
  assert.equal(model.badges.every(badge => badge.done === false), true)
})

test('currentCheckinStreak stops when completed check-ins have a calendar gap', () => {
  const checkins = [
    { date: '2026-08-26', review_completed_at: '2026-08-26T20:00:00Z' },
    { date: '2026-08-28', review_completed_at: '2026-08-28T20:00:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins), 1)
})

test('currentCheckinStreak treats midnight as the next user calendar day', () => {
  const checkins = [
    { review_completed_at: '2026-08-26T23:59:00Z' },
    { review_completed_at: '2026-08-27T00:01:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins, { timezone: 'UTC' }), 2)
})

test('currentCheckinStreak groups timestamps by the user timezone', () => {
  const checkins = [
    { review_completed_at: '2026-08-26T20:30:00Z' },
    { review_completed_at: '2026-08-27T00:30:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins, { timezone: 'Europe/Moscow' }), 2)
  assert.equal(currentCheckinStreak(checkins, { timezone: 'America/New_York' }), 1)
})

test('currentCheckinStreak becomes zero after a missed calendar day', () => {
  const checkins = [
    { date: '2026-08-25', review_completed_at: '2026-08-25T20:00:00Z' },
    { date: '2026-08-27', review_completed_at: '2026-08-27T20:00:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins), 1)
  assert.equal(longestCheckinStreak(checkins), 1)
})

test('first completed check-in starts at one and an empty history stays at zero', () => {
  assert.equal(currentCheckinStreak([{ date: '2026-08-25', review_completed_at: '2026-08-25T20:00:00Z' }]), 1)
  assert.equal(currentCheckinStreak([]), 0)
})

test('morning check-in without review_completed_at counts as a completed day', () => {
  assert.equal(
    currentCheckinStreak([{ date: '2026-09-24', mood: 3, energy: 2 }]),
    1
  )
})

test('yesterday check-in keeps a one-day series before today is completed', () => {
  assert.equal(
    currentCheckinStreak([
      { date: '2026-09-22', review_completed_at: '2026-09-22T08:00:00Z' },
    ]),
    1
  )
})

test('streak counts up to yesterday when today is not yet completed', () => {
  assert.equal(
    currentCheckinStreak([
      { date: '2026-09-22', review_completed_at: '2026-09-22T08:00:00Z' },
    ]),
    1
  )

  assert.equal(
    currentCheckinStreak([
      { date: '2026-09-22', review_completed_at: '2026-09-22T08:00:00Z' },
      { date: '2026-09-23', review_completed_at: '2026-09-23T08:00:00Z' },
    ]),
    2
  )
})

test('series metrics use one completed check-in dataset instead of stale profile totals', () => {
  const model = buildSeriesViewModel({
    stats: { total_checkins: 4, days_active: 23, best_streak: 0 },
    checkins: [{ date: '2026-09-22', review_completed_at: '2026-09-22T08:00:00Z' }],
  })
  assert.equal(model.currentStreak, 1)
  assert.equal(model.totalCheckins, 1)
  assert.equal(model.activeDays, 1)
  assert.equal(model.bestStreak, 1)
})

test('withTodayCheckin: утренний чек-ин за сегодня даёт серию 1, даже если истории ещё нет', async () => {
  const { withTodayCheckin } = await import('../../src/lib/series.js')
  const now = new Date(2026, 8, 24, 9, 0)
  assert.equal(currentCheckinStreak(withTodayCheckin([], { id: 7 }, now)), 1)
  assert.equal(currentCheckinStreak(withTodayCheckin([], null, now)), 0)
  const history = [{ date: '2026-09-23' }]
  assert.equal(currentCheckinStreak(withTodayCheckin(history, { date: '2026-09-24' }, now)), 2)
  assert.equal(
    currentCheckinStreak(withTodayCheckin([{ date: '2026-09-24' }], { date: '2026-09-24' }, now)),
    1
  )
})

test('currentCheckinStreak учитывает утреннюю запись только с created_at', () => {
  assert.equal(currentCheckinStreak([{ created_at: '2026-09-24T06:00:00Z' }]), 1)
})

// ── Новое правило: день засчитывается по любой активности ──

test('collectActivityDays: отметка ритуала сегодня добавляет сегодняшний день', () => {
  const now = new Date(2026, 8, 24, 10, 0)
  const days = collectActivityDays({
    rituals: [{ id: 1, today_level: 2 }],
    ascezas: [],
    moodPractices: [],
    now,
  })
  assert.deepEqual(days, ['2026-09-24'])
})

test('collectActivityDays: отметка аскезы сегодня добавляет сегодняшний день', () => {
  const now = new Date(2026, 8, 24, 10, 0)
  const days = collectActivityDays({
    rituals: [],
    ascezas: [{ id: 1, today_status: 'held' }],
    moodPractices: [],
    now,
  })
  assert.deepEqual(days, ['2026-09-24'])
})

test('collectActivityDays: записи «Настроение» добавляют свои даты', () => {
  const days = collectActivityDays({
    rituals: [],
    ascezas: [],
    moodPractices: [
      { recorded_at: '2026-09-22T15:00:00Z' },
      { recorded_at: '2026-09-23T10:00:00Z' },
    ],
  })
  assert.deepEqual(days.sort(), ['2026-09-22', '2026-09-23'])
})

test('collectActivityDays: без активности — пустой массив', () => {
  assert.deepEqual(collectActivityDays({}), [])
  assert.deepEqual(collectActivityDays({ rituals: [], ascezas: [], moodPractices: [] }), [])
})

test('mood practice засчитывает день в серию через activityDays', () => {
  // Вчера — чек-ин, сегодня — только mood practice (без чек-ина)
  const checkins = [{ date: '2026-09-23', review_completed_at: '2026-09-23T20:00:00Z' }]
  const activityDays = ['2026-09-24']
  assert.equal(currentCheckinStreak(checkins, { activityDays }), 2)
})

test('mood practice не засчитывается, если день уже есть в чек-инах (без дублирования)', () => {
  const checkins = [
    { date: '2026-09-23', review_completed_at: '2026-09-23T20:00:00Z' },
    { date: '2026-09-24', mood: 3, energy: 2 },
  ]
  const activityDays = ['2026-09-24'] // та же дата — не дублируется
  assert.equal(currentCheckinStreak(checkins, { activityDays }), 2)
})

test('buildSeriesViewModel учитывает moodPractices в серии', () => {
  const model = buildSeriesViewModel({
    checkins: [{ date: '2026-09-23', review_completed_at: '2026-09-23T20:00:00Z' }],
    moodPractices: [{ recorded_at: '2026-09-24T11:00:00Z' }],
  })
  assert.equal(model.currentStreak, 2)
})

test('buildSeriesViewModel: отметка ритуала сегодня продлевает серию', () => {
  const model = buildSeriesViewModel({
    checkins: [{ date: '2026-09-23', review_completed_at: '2026-09-23T20:00:00Z' }],
    rituals: [{ id: 1, today_level: 2 }],
  })
  // Сегодня засчитано через ритуал — серия = 2
  assert.equal(model.currentStreak, 2)
})
