import assert from 'node:assert/strict'
import test from 'node:test'

/** Локальный YYYY-MM-DD относительно сегодняшнего дня. */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function createStorage() {
  const values = new Map()
  return {
    get length() {
      return values.size
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(String(key), String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

const localStorage = createStorage()
const sessionStorage = createStorage()
globalThis.window = { localStorage, sessionStorage }
globalThis.localStorage = localStorage
globalThis.sessionStorage = sessionStorage

const { peekCachedStreak, rememberStreak, resolveDisplayedStreak } = await import(
  '../../src/lib/streakCache.js'
)
const { switchUserDataScope, resetUserDataScopeForTests } = await import(
  '../../src/lib/userDataScope.js'
)

test('до загрузки истории огонёк показывает кэш 6, а не «1» от сегодняшнего чек-ина', () => {
  rememberStreak(501, 6)
  const streak = resolveDisplayedStreak({
    historyLoaded: false,
    history: [],
    checkin: { date: dayKey(0) },
    cachedStreak: peekCachedStreak(501),
  })
  assert.equal(streak, 6)
})

test('без кэша до загрузки истории — огонь без числа (null)', () => {
  const streak = resolveDisplayedStreak({
    historyLoaded: false,
    history: [],
    checkin: { date: dayKey(0) },
    cachedStreak: peekCachedStreak(999),
  })
  assert.equal(streak, null)
})

test('после загрузки истории число считается по истории', () => {
  const streak = resolveDisplayedStreak({
    historyLoaded: true,
    history: [{ date: dayKey(0) }],
    checkin: null,
    cachedStreak: 6,
  })
  assert.equal(streak, 1)
})

test('#780: кэш серии изолирован по user id и чистится при смене пользователя', () => {
  resetUserDataScopeForTests()
  switchUserDataScope(601)
  rememberStreak(601, 6)
  assert.equal(peekCachedStreak(602), null)
  switchUserDataScope(602)
  assert.equal(peekCachedStreak(601), null)
  assert.equal(peekCachedStreak(0), null)
})
