import assert from 'node:assert/strict'
import test from 'node:test'

import { getKeyboardViewportHeight, isTelegramRuntime } from '../../src/lib/visualViewport.js'

function setWindow(overrides = {}) {
  globalThis.window = {
    location: { hash: '' },
    navigator: { standalone: false },
    matchMedia: () => ({ matches: false }),
    ...overrides,
  }
}

test.afterEach(() => {
  delete globalThis.window
})

test('getKeyboardViewportHeight keeps the visual height outside Telegram', () => {
  assert.equal(
    getKeyboardViewportHeight({ isTelegram: false, stableHeight: 800, visualHeight: 500 }),
    500
  )
})

test('getKeyboardViewportHeight uses the minimum height for Telegram keyboard layout', () => {
  assert.equal(
    getKeyboardViewportHeight({ isTelegram: true, stableHeight: 800, visualHeight: 500 }),
    500
  )
  assert.equal(
    getKeyboardViewportHeight({ isTelegram: true, stableHeight: 500, visualHeight: 800 }),
    500
  )
})

test('getKeyboardViewportHeight falls back to visual height for empty or zero stable values', () => {
  for (const stableHeight of [undefined, null, 0, -1, Number.NaN]) {
    assert.equal(
      getKeyboardViewportHeight({ isTelegram: true, stableHeight, visualHeight: 500 }),
      500
    )
  }

  assert.equal(
    getKeyboardViewportHeight({ isTelegram: true, stableHeight: 800, visualHeight: 0 }),
    null
  )
  assert.equal(
    getKeyboardViewportHeight({ isTelegram: true, stableHeight: 800, visualHeight: null }),
    null
  )
})

test('isTelegramRuntime detects initData, TelegramWebviewProxy, and Telegram hash', () => {
  setWindow({ Telegram: { WebApp: { initData: 'signed-data' } } })
  assert.equal(isTelegramRuntime(), true)

  setWindow({ TelegramWebviewProxy: {} })
  assert.equal(isTelegramRuntime(), true)

  setWindow({ location: { hash: '#tgWebAppData=signed-data' } })
  assert.equal(isTelegramRuntime(), true)
})

test('isTelegramRuntime rejects standalone Safari/PWA even with Telegram markers', () => {
  setWindow({
    Telegram: { WebApp: { initData: 'signed-data' } },
    matchMedia: query => ({ matches: query === '(display-mode: standalone)' }),
  })
  assert.equal(isTelegramRuntime(), false)

  setWindow({
    TelegramWebviewProxy: {},
    navigator: { standalone: true },
  })
  assert.equal(isTelegramRuntime(), false)
})
