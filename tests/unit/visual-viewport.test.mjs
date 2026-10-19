import assert from 'node:assert/strict'
import test from 'node:test'

import {
  KEYBOARD_MIN_INSET,
  getKeyboardViewportHeight,
  isTelegramRuntime,
  readKeyboardInset,
} from '../../src/lib/visualViewport.js'

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

/*
 * MXL-KEYBOARD-MOTION-001: инсет клавиатуры для «Диалога» (стратегия lift).
 * Опорой служит стабильная высота — в Telegram viewportStableHeight, иначе высота
 * окна: её анимация клавиатуры не меняет, поэтому инсет считается от устойчивой
 * величины, а не от «плывущей» видимой высоты.
 */

test('readKeyboardInset считает инсет от стабильной высоты, а не от высоты окна', () => {
  assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight: 500 }), 300)
  // Стабильная высота приоритетнее высоты окна: она не меняется при анимации.
  assert.equal(readKeyboardInset({ stableHeight: 800, windowHeight: 900, visualHeight: 500 }), 300)
  // Без стабильной высоты (не Telegram) опорой становится высота окна.
  assert.equal(readKeyboardInset({ windowHeight: 800, visualHeight: 500 }), 300)
  // Ни стабильной, ни высоты окна — считать не от чего: инсета нет.
  assert.equal(readKeyboardInset({ visualHeight: 500 }), 0)
})

test('readKeyboardInset держит мёртвую зону 80 px', () => {
  assert.equal(KEYBOARD_MIN_INSET, 80)

  // Авто-скрытие адресной строки и доводка раскрытия WebView — не клавиатура.
  assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight: 800 }), 0)
  assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight: 760 }), 0)
  // Видимая часть выше опоры (свернувшаяся адресная строка) — тоже не клавиатура.
  assert.equal(readKeyboardInset({ stableHeight: 500, visualHeight: 800 }), 0)
  // Ровно на пороге расхождение уже считается клавиатурой.
  assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight: 720 }), 80)
  // Выше порога инсет отдаётся целиком, а не обрезается по порогу.
  assert.equal(readKeyboardInset({ stableHeight: 852, visualHeight: 400 }), 452)
})

test('readKeyboardInset округляет инсет до целого пикселя', () => {
  // Дробная видимая высота (промежуточный кадр анимации) — дробь уходит.
  assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight: 250.6 }), 549)
  assert.equal(readKeyboardInset({ stableHeight: 800.4, visualHeight: 500 }), 300)
  // Округление идёт ДО сравнения с порогом: 79.6 — уже клавиатура, 79.4 — ещё нет.
  assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight: 720.4 }), 80)
  assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight: 720.6 }), 0)
})

test('readKeyboardInset не считает инсет без видимой высоты', () => {
  for (const visualHeight of [undefined, null, 0, -1, Number.NaN]) {
    assert.equal(readKeyboardInset({ stableHeight: 800, visualHeight }), 0)
  }
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
