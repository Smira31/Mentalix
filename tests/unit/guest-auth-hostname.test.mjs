import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * Unit-тест функции canAutoCreateGuest из src/lib/guestAuth.js.
 *
 * Автосоздание веб-гостя разрешено только на боевом хосте.
 * На превью-каналах Firebase, превью Base44, localhost и 127.0.0.1
 * гостя создавать нельзя — это загрязняло боевую БД.
 *
 * Тестовый флаг window.__MX_TEST_ALLOW_GUEST обходит проверку —
 * только для Playwright-тестов, не открывает автосоздание в превью.
 */

// Импортируем модуль с подменой platform (как в guest-login-dedup.test.mjs)
const moduleSource = `
const platform = globalThis.__testPlatform
${await import('node:fs/promises').then(fs =>
  fs.readFile(new URL('../../src/lib/guestAuth.js', import.meta.url), 'utf8')
).then(src =>
  src.replace("import { platform } from '../platform'", '')
)}
`
const moduleUrl = `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`

function setupEnv(hostname) {
  globalThis.window = {
    location: { hostname },
    __MX_TEST_ALLOW_GUEST: undefined,
  }
  globalThis.__testPlatform = { setUser: () => {}, clearUser: () => {} }
}

function clearTestFlag() {
  if (globalThis.window) delete globalThis.window.__MX_TEST_ALLOW_GUEST
}

test('canAutoCreateGuest: боевой хост mentalix-production.web.app → true', async () => {
  setupEnv('mentalix-production.web.app')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), true)
})

test('canAutoCreateGuest: боевой хост mentalix-production.firebaseapp.com → true', async () => {
  setupEnv('mentalix-production.firebaseapp.com')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), true)
})

test('canAutoCreateGuest: превью-канал Firebase (*--pr-*-*.web.app) → false', async () => {
  setupEnv('mentalix--pr-42-abc123.web.app')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), false)
})

test('canAutoCreateGuest: localhost → false', async () => {
  setupEnv('localhost')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), false)
})

test('canAutoCreateGuest: 127.0.0.1 → false', async () => {
  setupEnv('127.0.0.1')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), false)
})

test('canAutoCreateGuest: превью Base44 (*.base44-preview.app) → false', async () => {
  setupEnv('3000-abc123.base44-preview.app')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), false)
})

test('canAutoCreateGuest: произвольный хост → false', async () => {
  setupEnv('example.com')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), false)
})

test('canAutoCreateGuest: пустой hostname → false', async () => {
  setupEnv('')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), false)
})

test('canAutoCreateGuest: явный hostname аргумент переопределяет window.location', async () => {
  setupEnv('localhost')
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest('mentalix-production.web.app'), true)
  assert.equal(canAutoCreateGuest('127.0.0.1'), false)
})

test('canAutoCreateGuest: тестовый флаг __MX_TEST_ALLOW_GUEST → true на любом хосте', async () => {
  setupEnv('127.0.0.1')
  globalThis.window.__MX_TEST_ALLOW_GUEST = true
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), true)
  clearTestFlag()
})

test('canAutoCreateGuest: флаг __MX_TEST_ALLOW_GUEST=false не обходит проверку', async () => {
  setupEnv('localhost')
  globalThis.window.__MX_TEST_ALLOW_GUEST = false
  const { canAutoCreateGuest } = await import(moduleUrl)
  assert.equal(canAutoCreateGuest(), false)
  clearTestFlag()
})

/*
 * AUD-001: с отрицательным гостевым id запросы вида /pinned-practices
 * отвечают HTTP 500 — такой id не является canonical `users` row.
 * Guard hasCanonicalUserId пропускает только положительный id, поэтому
 * демо-гость с положительным id не блокируется, а боевой веб-гость
 * с отрицательным — блокируется.
 */

test('hasCanonicalUserId: пользователь с положительным id → true', async () => {
  const { hasCanonicalUserId } = await import(moduleUrl)
  assert.equal(hasCanonicalUserId({ id: 900001 }), true)
})

test('hasCanonicalUserId: демо-гость с положительным id 900002 → true', async () => {
  const { hasCanonicalUserId } = await import(moduleUrl)
  assert.equal(hasCanonicalUserId({ id: 900002, is_guest: true }), true)
})

test('hasCanonicalUserId: боевой веб-гость с отрицательным id → false', async () => {
  const { hasCanonicalUserId } = await import(moduleUrl)
  assert.equal(hasCanonicalUserId({ id: -145327, is_guest: true }), false)
})

test('hasCanonicalUserId: id строкой → true', async () => {
  const { hasCanonicalUserId } = await import(moduleUrl)
  assert.equal(hasCanonicalUserId({ id: '12345' }), true)
})

test('hasCanonicalUserId: нулевой, нечисловой и отсутствующий id → false', async () => {
  const { hasCanonicalUserId } = await import(moduleUrl)
  assert.equal(hasCanonicalUserId({ id: 0 }), false)
  assert.equal(hasCanonicalUserId({ id: 'abc' }), false)
  assert.equal(hasCanonicalUserId({}), false)
  assert.equal(hasCanonicalUserId(null), false)
})
