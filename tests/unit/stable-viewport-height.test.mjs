import assert from 'node:assert/strict'
import test from 'node:test'
import { mock } from 'node:test'

// --- Мок React: перехват useState/useEffect ---
let setHeightCalls = 0
let effectCallback = null

await mock.module('react', () => ({
  useState: init => {
    const value = typeof init === 'function' ? init() : init
    return [value, () => { setHeightCalls++ }]
  },
  useEffect: cb => { effectCallback = cb },
}))

// --- Мок window + visualViewport ---
function setupWindow(vvHeight = 800) {
  const vvListeners = {}
  const winListeners = {}

  globalThis.window = {
    visualViewport: {
      height: vvHeight,
      offsetTop: 0,
      addEventListener: (type, fn) => { vvListeners[type] = fn },
      removeEventListener: (type, fn) => { if (vvListeners[type] === fn) delete vvListeners[type] },
    },
    addEventListener: (type, fn) => { winListeners[type] = fn },
    removeEventListener: (type, fn) => { if (winListeners[type] === fn) delete winListeners[type] },
    location: { hash: '' },
    navigator: { standalone: false },
    matchMedia: () => ({ matches: false }),
  }

  return { vvListeners, winListeners }
}

function makeInput() {
  return { tagName: 'INPUT', isContentEditable: false }
}

// Импорт после установки моков
const { useStableViewportHeight } = await import('../../src/lib/visualViewport.js')

function runHook() {
  setHeightCalls = 0
  effectCallback = null
  useStableViewportHeight()
  return effectCallback()
}

test.afterEach(() => {
  delete globalThis.window
})

test('без фокуса: visualViewport.scroll не вызывает обновление', () => {
  const { vvListeners } = setupWindow()
  const cleanup = runHook()
  const callsAfterSetup = setHeightCalls

  // scroll-слушатель не зарегистрирован
  assert.equal(vvListeners.scroll, undefined, 'scroll listener should not be registered without focus')

  // попытка вызвать scroll ничего не делает
  vvListeners.scroll?.()
  assert.equal(setHeightCalls, callsAfterSetup, 'setHeight should not be called by scroll without focus')

  cleanup()
})

test('с фокусом: visualViewport.scroll вызывает обновление', () => {
  const { vvListeners, winListeners } = setupWindow()
  const cleanup = runHook()
  const callsAfterSetup = setHeightCalls

  // focusin на input → подписка на scroll
  winListeners.focusin({ target: makeInput() })
  assert.equal(typeof vvListeners.scroll, 'function', 'scroll listener should be registered after focusin')

  // scroll → обновление
  vvListeners.scroll()
  assert.equal(setHeightCalls, callsAfterSetup + 1, 'setHeight should be called by scroll when focused')

  cleanup()
})

test('после focusout: отписка от visualViewport.scroll', () => {
  const { vvListeners, winListeners } = setupWindow()
  const cleanup = runHook()
  const callsAfterSetup = setHeightCalls

  // focusin → подписка
  winListeners.focusin({ target: makeInput() })
  const callsAfterFocus = setHeightCalls

  // scroll работает
  vvListeners.scroll()
  assert.equal(setHeightCalls, callsAfterFocus + 1, 'scroll should update while focused')

  // focusout → отписка + один update
  winListeners.focusout({ target: makeInput() })
  assert.equal(vvListeners.scroll, undefined, 'scroll listener should be removed after focusout')
  const callsAfterFocusOut = setHeightCalls

  // scroll больше не вызывает обновление
  vvListeners.scroll?.()
  assert.equal(setHeightCalls, callsAfterFocusOut, 'scroll should not update after focusout')

  cleanup()
})

test('focusin на не-поле ввода не включает подписку на scroll', () => {
  const { vvListeners, winListeners } = setupWindow()
  const cleanup = runHook()

  winListeners.focusin({ target: { tagName: 'DIV', isContentEditable: false } })
  assert.equal(vvListeners.scroll, undefined, 'scroll listener should not be registered for non-editable element')

  cleanup()
})

test('contenteditable элемент включает подписку на scroll', () => {
  const { vvListeners, winListeners } = setupWindow()
  const cleanup = runHook()

  winListeners.focusin({ target: { tagName: 'DIV', isContentEditable: true } })
  assert.equal(typeof vvListeners.scroll, 'function', 'scroll listener should be registered for contenteditable')

  cleanup()
})
