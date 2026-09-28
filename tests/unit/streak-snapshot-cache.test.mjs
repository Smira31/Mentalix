import test from 'node:test'
import assert from 'node:assert/strict'
import {
  peekStreakSnapshot,
  removeStreakSnapshot,
  saveStreakSnapshot,
} from '../../src/lib/streakSnapshotCache.js'

/*
 * Персистентный снимок серии (streak в шапке «Сегодня»): мгновенное
 * число без мерцания при каждом монтировании Today, TTL и валидация
 * как у ответа /api/streak.
 */

const storage = new Map()
globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
}

const STATS = {
  currentStreak: 4,
  bestStreak: 9,
  activeDays: 12,
  isActiveToday: true,
  freezeUsedThisWeek: false,
  recoverable: false,
}

test.beforeEach(() => {
  storage.clear()
})

test('peek возвращает снимок в форме состояния Today ({ userId, value })', () => {
  saveStreakSnapshot(101, STATS)

  assert.deepEqual(peekStreakSnapshot(101), {
    userId: 101,
    value: {
      currentStreak: 4,
      bestStreak: 9,
      activeDays: 12,
      isActiveToday: true,
      freezeUsedThisWeek: false,
      recoverable: false,
    },
  })
})

test('снимок живёт 10 минут и удаляется по истечении TTL', () => {
  saveStreakSnapshot(101, STATS)

  const raw = JSON.parse(storage.get('mentalix:streak:snapshot:v1:101'))
  raw.savedAt = Date.now() - 10 * 60_000 - 1
  storage.set('mentalix:streak:snapshot:v1:101', JSON.stringify(raw))

  assert.equal(peekStreakSnapshot(101), null)
  assert.equal(storage.has('mentalix:streak:snapshot:v1:101'), false)
})

test('битый JSON и невалидная статистика читаются как null', () => {
  storage.set('mentalix:streak:snapshot:v1:101', '{broken')
  assert.equal(peekStreakSnapshot(101), null)

  // currentStreak отрицателен — форма снимка сломана, он удаляется.
  saveStreakSnapshot(101, STATS)
  const raw = JSON.parse(storage.get('mentalix:streak:snapshot:v1:101'))
  raw.stats.currentStreak = -1
  storage.set('mentalix:streak:snapshot:v1:101', JSON.stringify(raw))
  assert.equal(peekStreakSnapshot(101), null)
})

test('null не затирает последний валидный снимок', () => {
  saveStreakSnapshot(101, STATS)
  saveStreakSnapshot(101, null)

  assert.equal(peekStreakSnapshot(101)?.value.currentStreak, 4)
})

test('ключи разделены по пользователю и снимок можно удалить', () => {
  saveStreakSnapshot(101, STATS)
  saveStreakSnapshot(202, { ...STATS, currentStreak: 7 })

  assert.equal(peekStreakSnapshot(101).value.currentStreak, 4)
  assert.equal(peekStreakSnapshot(202).value.currentStreak, 7)

  removeStreakSnapshot(101)
  assert.equal(peekStreakSnapshot(101), null)
  assert.equal(peekStreakSnapshot(202)?.value.currentStreak, 7)
})

test('без userId сохранение и чтение безопасны', () => {
  saveStreakSnapshot(null, STATS)
  assert.equal(peekStreakSnapshot(null), null)
  removeStreakSnapshot(null)
})
