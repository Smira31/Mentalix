import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const demoSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
const todaySource = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')
const canonicalSource = await readFile(new URL('../../src/lib/canonicalStreak.js', import.meta.url), 'utf8')

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
 * Мягкая серия (GET /api/streak?user_id=<id>): единственный источник чисел
 * серии для Today. Клиентский расчёт по истории удалён; серверу принадлежат
 * календарная граница дня, признак активности и заморозка.
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
  assert.ok('freeze_used_this_week' in payload)
  assert.ok('recoverable' in payload)

  assert.equal(payload.current_streak, 5)
  assert.equal(payload.longest_streak, 5)
  assert.equal(payload.total_active_days, 6)
  assert.equal(typeof payload.is_active_today, 'boolean')
  // В дефолтном сценарии есть активность (ритуалы/асчезы), день уже засчитан.
  assert.equal(payload.is_active_today, true)
})

test('demo-контракт /streak: is_active_today реагирует на чек-ин (refresh после check-in)', async () => {
  freshDemoStorage()
  // «Новый пользователь»: пустое состояние без активности за сегодня.
  globalThis.sessionStorage.setItem('mentalix:demo-scenario:v1', 'Новый пользователь')
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

test('Today: серия приходит только с сервера, без клиентского расчёта по истории', () => {
  assert.match(todaySource, /const streak = canonical\?\.currentStreak \?\? null/)
  // Клиентский расчёт и кэш серии удалены из Today.
  assert.doesNotMatch(todaySource, /resolveDisplayedStreak/)
  assert.doesNotMatch(todaySource, /streakCache/)
  assert.doesNotMatch(todaySource, /rememberStreak/)
  // Модель значков строится без восстановления серии из неполной истории.
  assert.match(todaySource, /buildServerSeriesViewModel\(/)
  assert.doesNotMatch(todaySource, /\bbuildSeriesViewModel\(/)
})

test('Today: невалидный canonical ответ не подменяется расчётом', () => {
  // readCanonicalStreakStats принимает только безопасные целые >= 0.
  assert.match(
    canonicalSource,
    /Number\.isSafeInteger\(value\) && value >= 0 \? value : null/
  )
  // Нулевая серия — валидное canonical-значение (не «нет данных»).
  assert.match(canonicalSource, /currentStreak,/)
})

test('Today: сбой canonical streak не блокирует экран и не ломает историю', () => {
  // refreshStreak глотает ошибку: экран остаётся без числа серии, не падает.
  assert.match(todaySource, /\.catch\(\(\) => \{\}\)/)
  // refreshCheckin: streak и история грузятся через allSettled,
  // throw — только от history, canonical сбой остаётся невыбранным.
  const refreshBlock = todaySource.slice(
    todaySource.indexOf('async function refreshCheckin'),
    todaySource.indexOf('useEffect(() => {\n    if (previewFixture) return undefined')
  )
  assert.match(
    refreshBlock,
    /Promise\.allSettled\(\[\s*api\.checkin\.history\(user\.id, 90\),\s*api\.streak\(user\.id\),\s*\]\)/
  )
  assert.match(
    refreshBlock,
    /if \(historyResult\.status === 'rejected'\) throw historyResult\.reason/
  )
  assert.match(
    refreshBlock,
    /if \(streakResult\.status === 'fulfilled'\) \{\s*const streakValue = readCanonicalStreakStats\(streakResult\.value\)\s*saveStreakSnapshot\(user\.id, streakValue\)\s*setCanonicalStreak\(\{ userId: user\.id, value: streakValue \}\)/
  )
})

test('Today: после обновления чек-ина canonical streak обновляется целиком', () => {
  // В refreshCheckin валидный canonical ответ перезаписывает статистику
  // для пользователя и обновляет персистентный снимок серии.
  const refreshBlock = todaySource.slice(
    todaySource.indexOf('async function refreshCheckin'),
    todaySource.indexOf('useEffect(() => {\n    if (previewFixture) return undefined')
  )
  assert.match(
    refreshBlock,
    /const streakValue = readCanonicalStreakStats\(streakResult\.value\)\s*saveStreakSnapshot\(user\.id, streakValue\)\s*setCanonicalStreak\(\{ userId: user\.id, value: streakValue \}\)/
  )
})

test('Today: подтверждённая активность обновляет серию оптимистично и фоновым refresh', () => {
  // Любая завершённая активность (чек-ин, ритуал, настроение, запись)
  // диспатчит событие через api.js; Today слушает его и перезапрашивает серию.
  assert.match(apiSource, /mentalix:activity-saved/)
  const todayBlock = todaySource.slice(
    todaySource.indexOf('const activitySaved = event =>'),
    todaySource.indexOf('const [newBadge, setNewBadge]')
  )
  assert.match(todayBlock, /isActiveToday: true/)
  assert.match(todayBlock, /refreshStreak\(\)/)
  // Гонка запросов: поздний ответ старого запроса не перезаписывает новый.
  assert.match(todaySource, /const requestId = \+\+streakRequest\.current/)
  assert.match(todaySource, /if \(requestId !== streakRequest\.current\) return/)
})

test('Today: заморозка недели приходит с сервера и не выводится из истории', () => {
  // Отдельная заметка о заморозке показывается только по серверному флагу.
  assert.match(todaySource, /streakStats\?\.freezeUsedThisWeek/)
  assert.match(todaySource, /data-testid="streak-freeze-note"/)
  // Календарная активность дня — тоже серверное решение (is_active_today).
  assert.match(todaySource, /isToday && streakStats\?\.isActiveToday === true/)
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
