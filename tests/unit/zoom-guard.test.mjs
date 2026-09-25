import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { installZoomGuard } from '../../src/platform/zoomGuard.js'

const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8')

test('viewport meta содержит maximum-scale=1 и user-scalable=no', () => {
  const match = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"/)
  assert.ok(match, 'meta viewport не найден')
  const content = match[1]
  assert.match(content, /maximum-scale=1/, 'maximum-scale=1 отсутствует')
  assert.match(content, /user-scalable=no/, 'user-scalable=no отсутствует')
  // Остальные параметры сохранены
  assert.match(content, /width=device-width/, 'width=device-width отсутствует')
  assert.match(content, /initial-scale=1/, 'initial-scale=1 отсутствует')
  assert.match(content, /viewport-fit=cover/, 'viewport-fit=cover отсутствует')
  assert.match(content, /interactive-widget=resizes-content/, 'interactive-widget отсутствует')
})

test('zoomGuard регистрирует preventDefault-обработчик на gesturestart', () => {
  // Эмулируем минимальный window для проверки регистрации
  const listeners = {}
  const fakeWindow = {
    __mxZoomGuardInstalled: false,
    addEventListener(type, handler, options) {
      listeners[type] = { handler, options }
    },
  }
  // installZoomGuard использует глобальный window — подменяем
  const originalWindow = globalThis.window
  globalThis.window = fakeWindow
  try {
    installZoomGuard()
    assert.ok(listeners.gesturestart, 'обработчик gesturestart не зарегистрирован')
    assert.equal(listeners.gesturestart.options.passive, false, 'passive должен быть false')
    assert.ok(listeners.gesturechange, 'обработчик gesturechange не зарегистрирован')
    assert.ok(listeners.gestureend, 'обработчик gestureend не зарегистрирован')
    assert.ok(listeners.touchmove, 'обработчик touchmove не зарегистрирован')
    assert.equal(listeners.touchmove.options.passive, false, 'touchmove passive должен быть false')
  } finally {
    globalThis.window = originalWindow
  }
})

test('zoomGuard не регистрирует обработчики повторно', () => {
  const listeners = {}
  let callCount = 0
  const fakeWindow = {
    __mxZoomGuardInstalled: false,
    addEventListener(type, handler, options) {
      callCount++
      listeners[type] = { handler, options }
    },
  }
  const originalWindow = globalThis.window
  globalThis.window = fakeWindow
  try {
    installZoomGuard()
    const firstCount = callCount
    installZoomGuard() // повторный вызов — не должен ничего добавить
    assert.equal(callCount, firstCount, 'повторный installZoomGuard не должен добавлять обработчики')
  } finally {
    globalThis.window = originalWindow
  }
})

test('touchmove preventDefault срабатывает только при multi-touch', () => {
  const listeners = {}
  const fakeWindow = {
    __mxZoomGuardInstalled: false,
    addEventListener(type, handler, options) {
      listeners[type] = { handler, options }
    },
  }
  const originalWindow = globalThis.window
  globalThis.window = fakeWindow
  try {
    installZoomGuard()

    let prevented = false
    const fakeEvent = touches => ({
      touches,
      preventDefault() {
        prevented = true
      },
    })

    // Один палец — не блокируем
    prevented = false
    listeners.touchmove.handler(fakeEvent([{ clientX: 0, clientY: 0 }]))
    assert.equal(prevented, false, 'прокрутка одним пальцем не должна блокироваться')

    // Два пальца — блокируем
    prevented = false
    listeners.touchmove.handler(fakeEvent([
      { clientX: 0, clientY: 0 },
      { clientX: 100, clientY: 100 },
    ]))
    assert.equal(prevented, true, 'multi-touch touchmove должен блокироваться')
  } finally {
    globalThis.window = originalWindow
  }
})
