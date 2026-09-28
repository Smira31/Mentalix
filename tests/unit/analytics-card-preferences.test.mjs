import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  ANALYTICS_CARDS,
  ANALYTICS_CARDS_KEY,
  moveCard,
  normalizeCardPreferences,
  readCardPreferences,
  writeCardPreferences,
} from '../../src/screens/progress/analyticsCardPreferences.js'

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

test('заморозка недели приходит с сервера, аналитика не считает серию локально', async () => {
  // Один пропуск в календарную неделю не рвёт мягкую серию — это
  // серверное правило (GET /api/streak, freeze_used_this_week).
  // Клиент больше не пересчитывает серию по истории чек-инов.
  const { readCanonicalStreakStats } = await import('../../src/lib/canonicalStreak.js')
  const stats = readCanonicalStreakStats({
    current_streak: 3,
    longest_streak: 3,
    total_active_days: 4,
    freeze_used_this_week: true,
  })
  assert.equal(stats.currentStreak, 3)
  assert.equal(stats.freezeUsedThisWeek, true, 'заморозка недели передаётся из ответа сервера')

  const analyticsSource = await readFile(new URL('../../src/screens/Analytics.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(analyticsSource, /currentCheckinStreak/)
  assert.doesNotMatch(analyticsSource, /streakCache/)
})
