import assert from 'node:assert/strict'
import test from 'node:test'

import { setupStableViewportListeners } from '../../src/lib/visualViewport.js'

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

function makeDiv() {
  return { tagName: 'DIV', isContentEditable: false }
}

function makeContentEditable() {
  return { tagName: 'DIV', isContentEditable: true }
}

function runSetup(setHeight) {
  return setupStableViewportListeners({
    viewport: globalThis.window.visualViewport,
    window: globalThis.window,
    webApp: null,
    setHeight,
  })
}

test.afterEach(() => {
  delete globalThis.window
})

test('без фокуса: visualViewport.scroll не вызывает обновление', () => {
  const { vvListeners } = setupWindow()
  let calls = 0
  const setHeight = () => { calls++ }

  const cleanup = runSetup(setHeight)
  const callsAfterSetup = calls

  // scroll-слушатель не зарегистрирован
  assert.equal(vvListeners.scroll, undefined, 'scroll listener should not be registered without focus')

  // попытка вызвать scroll ничего не делает
  vvListeners.scroll?.()
  assert.equal(calls, callsAfterSetup, 'setHeight should not be called by scroll without focus')

  cleanup()
})

test('с фокусом: visualViewport.scroll вызывает обновление', () => {
  const { vvListeners, winListeners } = setupWindow()
  let calls = 0
  const setHeight = () => { calls++ }

  const cleanup = runSetup(setHeight)
  const callsAfterSetup = calls

  // focusin на input → подписка на scroll
  winListeners.focusin({ target: makeInput() })
  assert.equal(typeof vvListeners.scroll, 'function', 'scroll listener should be registered after focusin')

  // scroll → обновление
  vvListeners.scroll()
  assert.equal(calls, callsAfterSetup + 1, 'setHeight should be called by scroll when focused')

  cleanup()
})

test('после focusout: отписка от visualViewport.scroll', () => {
  const { vvListeners, winListeners } = setupWindow()
  let calls = 0
  const setHeight = () => { calls++ }

  const cleanup = runSetup(setHeight)

  // focusin → подписка
  winListeners.focusin({ target: makeInput() })
  const callsAfterFocus = calls

  // scroll работает
  vvListeners.scroll()
  assert.equal(calls, callsAfterFocus + 1, 'scroll should update while focused')

  // focusout → отписка + один update
  winListeners.focusout({ target: makeInput() })
  assert.equal(vvListeners.scroll, undefined, 'scroll listener should be removed after focusout')
  const callsAfterFocusOut = calls

  // scroll больше не вызывает обновление
  vvListeners.scroll?.()
  assert.equal(calls, callsAfterFocusOut, 'scroll should not update after focusout')

  cleanup()
})

test('focusin на не-поле ввода не включает подписку на scroll', () => {
  const { vvListeners, winListeners } = setupWindow()
  const cleanup = runSetup(() => {})

  winListeners.focusin({ target: makeDiv() })
  assert.equal(vvListeners.scroll, undefined, 'scroll listener should not be registered for non-editable element')

  cleanup()
})

test('contenteditable элемент включает подписку на scroll', () => {
  const { vvListeners, winListeners } = setupWindow()
  const cleanup = runSetup(() => {})

  winListeners.focusin({ target: makeContentEditable() })
  assert.equal(typeof vvListeners.scroll, 'function', 'scroll listener should be registered for contenteditable')

  cleanup()
})
