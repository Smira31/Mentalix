import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Функциональный тест дедупликации гостевого входа.
 *
 * loginAsGuest использует in-flight промис на уровне модуля: два параллельных
 * вызова (имитация React StrictMode) делают один POST /api/auth/guest,
 * оба получают одинаковый результат. После завершения промис сбрасывается,
 * чтобы кнопка «Продолжить без входа» могла повторить вход.
 *
 * Платформа в Node недоступна — заменяем import на глобальный mock.
 */

const source = await readFile(new URL('../../src/lib/guestAuth.js', import.meta.url), 'utf8')

const moduleSource = source.replace(
  "import { platform } from '../platform'",
  'const platform = globalThis.__testPlatform'
)

const moduleUrl = `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`

function makeStorage() {
  const items = new Map()
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: key => items.delete(key),
  }
}

function setupEnv() {
  globalThis.window = { localStorage: makeStorage() }
  globalThis.__testPlatform = {
    setUser: () => {},
    clearUser: () => {},
  }
}

test('два параллельных вызова loginAsGuest → один POST /api/auth/guest, оба получают одинаковый результат', async () => {
  setupEnv()
  const guestAuth = await import(moduleUrl)

  let guestCallCount = 0
  const mockApi = {
    auth: {
      guest: () => {
        guestCallCount += 1
        return new Promise(resolve => {
          setTimeout(
            () => resolve({ ok: true, user: { id: 1, is_guest: true }, merge_token: 'tok' }),
            10
          )
        })
      },
    },
  }

  const callbacks = []
  await Promise.all([
    guestAuth.loginAsGuest(mockApi, user => callbacks.push(['first', user])),
    guestAuth.loginAsGuest(mockApi, user => callbacks.push(['second', user])),
  ])

  assert.equal(guestCallCount, 1, 'должен быть только один POST /api/auth/guest')
  assert.equal(callbacks.length, 2, 'оба вызова должны получить результат через onAuthed')
  assert.deepEqual(callbacks[0][1], { id: 1, is_guest: true })
  assert.deepEqual(callbacks[1][1], { id: 1, is_guest: true })
})

test('после завершения промиса in-flight сбрасывается — повторный вызов делает новый POST', async () => {
  setupEnv()
  const guestAuth = await import(moduleUrl)

  let guestCallCount = 0
  const mockApi = {
    auth: {
      guest: () => {
        guestCallCount += 1
        return Promise.resolve({
          ok: true,
          user: { id: 2, is_guest: true },
          merge_token: 'tok2',
        })
      },
    },
  }

  await guestAuth.loginAsGuest(mockApi, () => {})
  await guestAuth.loginAsGuest(mockApi, () => {})

  assert.equal(guestCallCount, 2, 'после сброса in-flight каждый вызов делает новый POST')
})

test('ошибка первого вызова сбрасывает in-flight — повторный вызов делает новый POST', async () => {
  setupEnv()
  const guestAuth = await import(moduleUrl)

  let guestCallCount = 0
  const mockApi = {
    auth: {
      guest: () => {
        guestCallCount += 1
        if (guestCallCount === 1) return Promise.resolve({ ok: false })
        return Promise.resolve({
          ok: true,
          user: { id: 3, is_guest: true },
          merge_token: 'tok3',
        })
      },
    },
  }

  // Первый параллельный пакет — оба получают ошибку, onAuthed не вызывается
  const callbacks = []
  await Promise.allSettled([
    guestAuth.loginAsGuest(mockApi, user => callbacks.push(['first', user])).catch(() => {}),
    guestAuth.loginAsGuest(mockApi, user => callbacks.push(['second', user])).catch(() => {}),
  ])

  assert.equal(guestCallCount, 1, 'первый пакет — один POST')
  assert.equal(callbacks.length, 0, 'при ошибке onAuthed не вызывается')

  // Повторный вызов после ошибки — новый POST
  await guestAuth.loginAsGuest(mockApi, user => callbacks.push(['retry', user]))

  assert.equal(guestCallCount, 2, 'после ошибки in-flight сброшен — новый POST')
  assert.equal(callbacks.length, 1)
  assert.deepEqual(callbacks[0][1], { id: 3, is_guest: true })
})
