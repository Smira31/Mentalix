import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSeriesViewModel, currentCheckinStreak, longestCheckinStreak } from '../../src/lib/series.js'

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

test('yesterday check-in keeps a one-day series before today is completed', () => {
  assert.equal(
    currentCheckinStreak([
      { date: '2026-09-22', review_completed_at: '2026-09-22T08:00:00Z' },
    ]),
    1
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
