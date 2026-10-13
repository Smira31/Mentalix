import assert from 'node:assert/strict'
import test from 'node:test'

import { clearAllAlterEgos, loadAlterEgos, saveAlterEgo } from '../../src/lib/alterEgoStorage.js'

/*
 * CloudStorage появился в Bot API 6.9. На более старых клиентах объект
 * существует, но SDK при вызове сам печатает console.error
 * «CloudStorage is not supported in version …» и бросает
 * WebAppMethodUnsupported — из-за этого консоль предпросмотра (версия
 * клиента 6.0) была красной. Проверяем: до 6.9 хранилище альтер-эго
 * молча уходит в localStorage, с 6.9 — в облако, и ни один вызов
 * CloudStorage на старой версии не происходит.
 *
 * Модуль читает window только внутри функций, поэтому глобальное
 * окружение можно подменять между тестами без перезагрузки модуля.
 */

function setupEnvironment({ version, hasCloudStorage = true }) {
  const calls = { getItem: 0, setItem: 0, removeItem: 0 }
  const cloudValues = new Map()
  const localValues = new Map()
  const consoleErrors = []

  const originalConsoleError = console.error
  console.error = (...args) => consoleErrors.push(args.join(' '))

  const cloud = {
    getItem(key, callback) {
      calls.getItem += 1
      callback(null, cloudValues.get(key) ?? '')
    },
    setItem(key, value, callback) {
      calls.setItem += 1
      cloudValues.set(key, value)
      callback(null, true)
    },
    removeItem(key, callback) {
      calls.removeItem += 1
      cloudValues.delete(key)
      callback(null, true)
    },
  }

  globalThis.window = {
    Telegram: {
      WebApp: {
        version,
        isVersionAtLeast: required => version >= required,
        ...(hasCloudStorage ? { CloudStorage: cloud } : {}),
      },
    },
  }

  globalThis.localStorage = {
    getItem: key => (localValues.has(key) ? localValues.get(key) : null),
    setItem: (key, value) => localValues.set(key, String(value)),
    removeItem: key => localValues.delete(key),
  }

  return {
    calls,
    cloudValues,
    localValues,
    consoleErrors,
    cleanup: () => {
      console.error = originalConsoleError
    },
  }
}

const CARD = {
  id: 'alter-ego-1',
  name: 'Наблюдатель',
  situation: 'сложный разговор',
  qualities: ['спокойствие', 'ясность', 'уважение'],
  posture: 'плечи ровно',
  anchor: 'одна фраза',
}

test('Bot API < 6.9: альтер-эго сохраняется локально, CloudStorage не вызывается и консоль чистая', async () => {
  const env = setupEnvironment({ version: '6.0' })
  try {
    const saved = await saveAlterEgo(CARD)

    assert.equal(saved.name, 'Наблюдатель')
    assert.deepEqual(env.calls, { getItem: 0, setItem: 0, removeItem: 0 })
    assert.equal(env.localValues.has('mx-alter-egos'), true, 'запись должна лежать в localStorage')

    const loaded = await loadAlterEgos()

    assert.equal(loaded.length, 1)
    assert.equal(loaded[0].id, 'alter-ego-1')

    await clearAllAlterEgos()

    assert.equal(env.localValues.has('mx-alter-egos'), false)
    assert.deepEqual(env.consoleErrors, [], 'SDK не должен логировать «CloudStorage is not supported»')
  } finally {
    env.cleanup()
  }
})

test('Bot API ≥ 6.9: альтер-эго уходит в CloudStorage', async () => {
  const env = setupEnvironment({ version: '8.0' })
  try {
    await saveAlterEgo(CARD)

    // saveAlterEgo сначала читает текущий список, затем пишет новый.
    assert.equal(env.calls.setItem, 1, 'на новой версии запись идёт через CloudStorage')
    assert.equal(env.localValues.has('mx-alter-egos'), false, 'localStorage не используется')

    const loaded = await loadAlterEgos()

    assert.equal(loaded.length, 1)
    assert.equal(env.calls.getItem, 2, 'одно чтение в saveAlterEgo + одно в loadAlterEgos')
    assert.deepEqual(env.consoleErrors, [])
  } finally {
    env.cleanup()
  }
})

test('Вне Telegram: работает localStorage, CloudStorage не тронут', async () => {
  const env = setupEnvironment({ version: '6.0', hasCloudStorage: false })
  try {
    await saveAlterEgo(CARD)

    assert.deepEqual(env.calls, { getItem: 0, setItem: 0, removeItem: 0 })
    assert.equal((await loadAlterEgos()).length, 1)
    assert.deepEqual(env.consoleErrors, [])
  } finally {
    env.cleanup()
  }
})
