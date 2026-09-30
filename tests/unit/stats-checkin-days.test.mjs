import test from 'node:test'
import assert from 'node:assert/strict'

import { countUniqueCheckinDates } from '../../src/lib/series.js'

function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

test('countUniqueCheckinDates: пустой список → 0', () => {
  assert.equal(countUniqueCheckinDates([]), 0)
  assert.equal(countUniqueCheckinDates(), 0)
})

test('countUniqueCheckinDays: один завершённый чек-ин → 1', () => {
  const key = dayKey(-1)
  assert.equal(
    countUniqueCheckinDates([{ date: key, review_completed_at: `${key}T20:00:00Z` }]),
    1
  )
})

test('countUniqueCheckinDates: уникальные даты завершённых чек-инов (утро или разбор)', () => {
  const d1 = dayKey(-3)
  const d2 = dayKey(-2)
  const d3 = dayKey(-1)
  const checkins = [
    // Завершённый утренний чек-ин (completed_at)
    { date: d1, completed_at: `${d1}T08:00:00Z` },
    // Завершённый разбор (review_completed_at)
    { date: d2, review_completed_at: `${d2}T20:00:00Z` },
    // Незавершённый чек-ин — не считается
    { date: d3, completed_at: null, review_completed_at: null, status: 'pending' },
  ]
  assert.equal(countUniqueCheckinDates(checkins), 2)
})

test('countUniqueCheckinDates: дубликаты даты считаются один раз', () => {
  const key = dayKey(-1)
  const checkins = [
    { date: key, completed_at: `${key}T08:00:00Z` },
    { date: key, review_completed_at: `${key}T20:00:00Z` },
    { date: key, status: 'completed' },
  ]
  assert.equal(countUniqueCheckinDates(checkins), 1)
})

test('countUniqueCheckinDates: status completed тоже считается', () => {
  const key = dayKey(-1)
  const checkins = [{ date: key, status: 'completed' }]
  assert.equal(countUniqueCheckinDates(checkins), 1)
})

test('countUniqueCheckinDates: незавершённые чек-ины не считаются', () => {
  const d1 = dayKey(-2)
  const d2 = dayKey(-1)
  const checkins = [
    { date: d1, completed_at: null, review_completed_at: null, status: 'pending' },
    { date: d2, completed_at: null, review_completed_at: null },
  ]
  assert.equal(countUniqueCheckinDates(checkins), 0)
})

test('countUniqueCheckinDates: даты без date берутся из completed_at', () => {
  const d1 = dayKey(-2)
  const d2 = dayKey(-1)
  const checkins = [
    { completed_at: `${d1}T08:00:00Z` },
    { review_completed_at: `${d2}T20:00:00Z` },
  ]
  assert.equal(countUniqueCheckinDates(checkins), 2)
})
