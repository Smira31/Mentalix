import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSeriesViewModel, currentCheckinStreak } from '../../src/lib/series.js'

test('currentCheckinStreak counts the completed tail in chronological order', () => {
  const checkins = [
    { date: '2026-08-26', review_completed_at: '2026-08-26T20:00:00Z' },
    { date: '2026-08-28', review_completed_at: '2026-08-28T20:00:00Z' },
    { date: '2026-08-27', review_completed_at: '2026-08-27T20:00:00Z' },
  ]

  assert.equal(currentCheckinStreak(checkins), 3)
})

test('currentCheckinStreak stops at the first incomplete check-in', () => {
  const checkins = [
    { date: '2026-08-25', review_completed_at: '2026-08-25T20:00:00Z' },
    { date: '2026-08-26', review_completed_at: null },
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
  assert.equal(model.bestStreak, 4)
  assert.equal(model.totalCheckins, 5)
  assert.equal(model.activeDays, 7)
  assert.equal(model.badges.length, 6)
  assert.equal(model.badges.find(badge => badge.id === 'voice-heard').done, true)
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
