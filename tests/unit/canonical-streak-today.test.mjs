import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const demoSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
const todaySource = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

function memoryStorage() {
  const map = new Map()
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
  }
}

function freshDemoStorage() {
  globalThis.localStorage = memoryStorage()
  globalThis.sessionStorage = memoryStorage()
}

freshDemoStorage()
const { demoRequest } = await import('../../src/lib/demoMode.js')

/*
 * Canonical streak (GET /api/streak?user_id=<id>, backend PR #108):
 * число в огоньке «Сегодня» берётся из canonical current_streak,
 * существующий history/cache расчёт остаётся только fallback.
 */

test('api.streak: контракт GET /streak с user_id и silentDiagnostics', () => {
  assert.match(
    apiSource,
    /streak:\s*userId\s*=>\s*request\(withQuery\('\/streak',\s*\{\s*user_id:\s*userId\s*\}\),\s*\{\s*silentDiagnostics:\s*true,?\s*\}\)/
  )
})

test('demo-контракт /streak отдаёт canonical-поля из профиля демо-состояния', async () => {
  freshDemoStorage()
  // Дефолтный сценарий без sessionStorage — «Неделя».
  const payload = await demoRequest('/streak?user_id=900001', { method: 'GET' })

  assert.ok(payload && typeof payload === 'object')
  assert.ok('current_streak' in payload)
  assert.ok('longest_streak' in payload)
  assert.ok('total_active_days' in payload)
  assert.ok('is_active_today' in payload)

  assert.equal(payload.current_streak, 5)
  assert.equal(payload.longest_streak, 5)
  assert.equal(payload.total_active_days, 6)
  assert.equal(typeof payload.is_active_today, 'boolean')
})

test('demo-контракт /streak: is_active_today реагирует на чек-ин (refresh после check-in)', async () => {
  freshDemoStorage()
  const before = await demoRequest('/streak?user_id=900001', { method: 'GET' })
  assert.equal(before.is_active_today, false)

  await demoRequest('/checkin', {
    method: 'POST',
    body: JSON.stringify({ user_id: 900001, mood: 3, energy: 2, note: 'Тест.' }),
  })

  const after = await demoRequest('/streak?user_id=900001', { method: 'GET' })
  assert.equal(after.is_active_today, true)
  // Canonical current_streak остаётся числом и после обновления чек-ина.
  assert.equal(typeof after.current_streak, 'number')
})

test('Today: canonical current_streak — primary source, history/cache расчёт — fallback', () => {
  assert.match(todaySource, /const streak = canonicalStreakValue \?\? fallbackStreak/)
  // Fallback считается тем же resolveDisplayedStreak, что и раньше.
  assert.match(todaySource, /const fallbackStreak = resolveDisplayedStreak\(\{/)
  // Canonical применяется только для текущего пользователя.
  assert.match(
    todaySource,
    /canonicalStreak\?\.userId === user\?\.id \? canonicalStreak\.value : null/
  )
})

test('Today: невалидный canonical ответ не заменяет fallback', () => {
  // readCanonicalCurrentStreak принимает только безопасное целое >= 0.
  assert.match(
    todaySource,
    /Number\.isSafeInteger\(value\) && value >= 0 \? value : null/
  )
  // Нулевая серия — валидное canonical-значение (не «нет данных»).
  assert.match(todaySource, /currentStreak != null/)
})

test('Today: ошибка/задержка canonical streak не ломает загрузку истории', () => {
  // refreshCheckin: streak и история грузятся через allSettled,
  // throw — только от history, canonical сбой остаётся fallback.
  assert.match(
    todaySource,
    /Promise\.allSettled\(\[\s*api\.checkin\.history\(user\.id, 90\),\s*api\.streak\(user\.id\),\s*\]\)/
  )
  assert.match(
    todaySource,
    /if \(historyResult\.status === 'rejected'\) throw historyResult\.reason/
  )
  assert.match(
    todaySource,
    /if \(streakResult\.status === 'fulfilled'\) \{\s*const currentStreak = readCanonicalCurrentStreak\(streakResult\.value\)/
  )
  // Первичная загрузка: сбой canonical не блокирует экран (non-blocking fallback).
  const mountBlock = todaySource.slice(
    todaySource.indexOf('api.health.check().catch(() => {})'),
    todaySource.indexOf(';(async () => {')
  )
  assert.match(mountBlock, /api\.streak\(user\.id\)/)
  assert.match(
    mountBlock,
    /\.catch\(\(\) => \{\s*\/\/ Existing history\/cache path remains a non-blocking fallback\.\s*\}\)/
  )
})

test('Today: после обновления чек-ина canonical streak обновляется', () => {
  // В refreshCheckin валидный canonical ответ перезаписывает значение для пользователя.
  const refreshBlock = todaySource.slice(
    todaySource.indexOf('async function refreshCheckin'),
    todaySource.indexOf('function splitCheckinsForComparison')
  )
  assert.match(
    refreshBlock,
    /setCanonicalStreak\(\{ userId: user\.id, value: currentStreak \}\)/
  )
})

test('demoMode: обработчик /streak не перехватывает /streak/recovery', () => {
  const streakHandlerIndex = demoSource.indexOf("pathname === '/streak' && method === 'GET'")
  const recoveryHandlerIndex = demoSource.indexOf("pathname === '/streak/recovery'")
  assert.ok(streakHandlerIndex > -1, 'demo-обработчик /streak существует')
  assert.ok(recoveryHandlerIndex > -1, 'demo-обработчик /streak/recovery существует')
  assert.ok(
    streakHandlerIndex < recoveryHandlerIndex,
    'точный матчинг /streak не мешает /streak/recovery'
  )
})
