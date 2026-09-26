import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ANALYTICS_CARDS,
  ANALYTICS_CARDS_KEY,
  moveCard,
  normalizeCardPreferences,
  readCardPreferences,
  writeCardPreferences,
} from '../../src/screens/progress/analyticsCardPreferences.js'
import { currentCheckinStreak } from '../../src/lib/series.js'

test('hidden card can be restored and custom order survives reloading', () => {
  const memory = new Map()
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  }
  const initial = readCardPreferences(storage)
  const hidden = { ...initial, hidden: ['up'] }
  writeCardPreferences(hidden, storage)
  assert(!readCardPreferences(storage).order.filter(id => !readCardPreferences(storage).hidden.includes(id)).includes('up'))
  const restored = { ...readCardPreferences(storage), hidden: [] }
  writeCardPreferences({ ...restored, order: moveCard(restored.order, 'up', -1) }, storage)
  assert(readCardPreferences(storage).order.filter(id => !readCardPreferences(storage).hidden.includes(id)).includes('up'))
  assert.equal(readCardPreferences(storage).order.indexOf('up'), 1)
  assert(memory.has(ANALYTICS_CARDS_KEY))
})

test('unavailable storage and malformed preferences use default order', () => {
  const blocked = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('blocked') },
  }
  assert.deepEqual(readCardPreferences(blocked).order, ANALYTICS_CARDS.map(card => card.id))
  assert.doesNotThrow(() => writeCardPreferences({ order: [], hidden: [] }, blocked))
  // Старые/неизвестные id (trend, unknown) игнорируются; известные сохраняются
  const normalized = normalizeCardPreferences({ order: ['trend', 'calendar', 'unknown'], hidden: ['unknown', 'trend'] })
  assert.deepEqual(normalized.order.slice(0, 2), ['calendar', 'emotions'])
  assert.deepEqual(normalized.hidden, [])
})

test('series counts a single skipped day this week', () => {
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  const date = daysAgo => {
    const value = new Date(now)
    value.setDate(value.getDate() - daysAgo)
    return value.toISOString().slice(0, 10)
  }
  const checkins = [3, 2, 0].map(daysAgo => ({ date: date(daysAgo), review_completed_at: `${date(daysAgo)}T20:00:00Z` }))
  assert.equal(currentCheckinStreak(checkins, { now, timezone: 'UTC' }), 3)
})
