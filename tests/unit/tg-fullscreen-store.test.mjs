import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * MXL-FULLSCREEN-SURFACE-RACE-001 — tgFullscreen.js держит module-level
 * singleton state (negotiationStarted/confirmed/snapshot/listeners), так
 * каждый тест импортирует его через cache-busting query (?case=N), чтобы
 * получить независимый экземпляр модуля вместо одного, расшариваемого
 * между тестами — без добавления test-only reset-экспорта в production-код.
 */
let moduleCounter = 0

async function freshModule() {
  moduleCounter += 1

  return import(`../../src/lib/tgFullscreen.js?case=${moduleCounter}`)
}

function setupDom() {
  const cssVars = new Map()

  globalThis.document = {
    documentElement: {
      style: {
        setProperty: (name, value) => cssVars.set(name, value),
      },
    },
  }

  return cssVars
}

function setupTelegramWebApp(overrides = {}) {
  const listeners = new Map()
  const calls = { ready: 0, expand: 0, requestFullscreen: 0 }

  const webApp = {
    initData: 'mock-init-data',
    isFullscreen: false,
    safeAreaInset: {},
    contentSafeAreaInset: {},
    ready: () => {
      calls.ready += 1
    },
    expand: () => {
      calls.expand += 1
    },
    requestFullscreen: () => {
      calls.requestFullscreen += 1

      return Promise.resolve()
    },
    onEvent: (name, callback) => {
      const bucket = listeners.get(name) || []
      bucket.push(callback)
      listeners.set(name, bucket)
    },
    offEvent: (name, callback) => {
      const bucket = listeners.get(name) || []
      listeners.set(
        name,
        bucket.filter(fn => fn !== callback)
      )
    },
    ...overrides,
  }

  globalThis.window = { Telegram: { WebApp: webApp } }

  return { webApp, listeners, calls }
}

function setupNoTelegram() {
  globalThis.window = {}
}

function emit(listeners, name, payload) {
  for (const callback of listeners.get(name) || []) callback(payload)
}

test('MXL-FULLSCREEN-SURFACE-RACE-001 pessimistic default: внутри Telegram снапшот true до подтверждения', async () => {
  setupDom()
  setupTelegramWebApp()

  const mod = await freshModule()

  assert.equal(mod.getFullscreenSnapshot(), true)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 fullscreenChanged подтверждает реальное значение и снимает pessimism', async () => {
  setupDom()
  const { listeners } = setupTelegramWebApp()

  const mod = await freshModule()
  assert.equal(mod.getFullscreenSnapshot(), true)

  emit(listeners, 'fullscreenChanged', { isFullscreen: false })

  assert.equal(mod.getFullscreenSnapshot(), false)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 web (не Telegram): сразу false, без pessimism', async () => {
  setupDom()
  setupNoTelegram()

  const mod = await freshModule()

  assert.equal(mod.getFullscreenSnapshot(), false)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 идемпотентность: множественный subscribe (StrictMode double-invoke) не дублирует Telegram-инициализацию', async () => {
  setupDom()
  const { calls } = setupTelegramWebApp()

  const mod = await freshModule()

  const unsubscribeA = mod.subscribeFullscreen(() => {})
  const unsubscribeB = mod.subscribeFullscreen(() => {})
  unsubscribeA()
  const unsubscribeC = mod.subscribeFullscreen(() => {})

  assert.equal(calls.ready, 1)
  assert.equal(calls.expand, 1)
  assert.equal(calls.requestFullscreen, 1)

  unsubscribeB()
  unsubscribeC()
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 уведомляет всех текущих подписчиков при смене состояния', async () => {
  setupDom()
  const { listeners } = setupTelegramWebApp()

  const mod = await freshModule()
  let notifiedA = 0
  let notifiedB = 0
  mod.subscribeFullscreen(() => {
    notifiedA += 1
  })
  mod.subscribeFullscreen(() => {
    notifiedB += 1
  })

  emit(listeners, 'fullscreenChanged', { isFullscreen: false })

  assert.equal(notifiedA, 1)
  assert.equal(notifiedB, 1)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 unsubscribe убирает только своего слушателя', async () => {
  setupDom()
  const { listeners } = setupTelegramWebApp()

  const mod = await freshModule()
  let notifiedA = 0
  let notifiedB = 0
  const unsubscribeA = mod.subscribeFullscreen(() => {
    notifiedA += 1
  })
  mod.subscribeFullscreen(() => {
    notifiedB += 1
  })

  unsubscribeA()
  emit(listeners, 'fullscreenChanged', { isFullscreen: false })

  assert.equal(notifiedA, 0)
  assert.equal(notifiedB, 1)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 ALREADY_FULLSCREEN: requestFullscreen не вызывается, если уже fullscreen', async () => {
  setupDom()
  const { calls } = setupTelegramWebApp({ isFullscreen: true })

  const mod = await freshModule()

  assert.equal(mod.getFullscreenSnapshot(), true)
  assert.equal(calls.requestFullscreen, 0)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 fallback-таймаут подтверждает реальное значение, если событие не пришло', async t => {
  setupDom()
  setupTelegramWebApp()

  t.mock.timers.enable({ apis: ['setTimeout'] })

  const mod = await freshModule()
  assert.equal(mod.getFullscreenSnapshot(), true)

  t.mock.timers.tick(2000)

  assert.equal(mod.getFullscreenSnapshot(), false)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 getFullscreenSnapshot безопасен без window (SSR/тестовое окружение)', async () => {
  delete globalThis.window
  delete globalThis.document

  const mod = await freshModule()

  assert.doesNotThrow(() => mod.getFullscreenSnapshot())
  assert.equal(mod.getFullscreenSnapshot(), false)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 импорт модуля без вызова subscribe/getSnapshot не трогает DOM/Telegram', async () => {
  let touched = false
  globalThis.document = {
    documentElement: {
      style: {
        setProperty: () => {
          touched = true
        },
      },
    },
  }
  setupTelegramWebApp()

  await freshModule()

  assert.equal(touched, false)
})

test('MXL-FULLSCREEN-SURFACE-RACE-001 initFullscreen (legacy API): вызывает onChange сразу и на каждое изменение', async () => {
  setupDom()
  const { listeners } = setupTelegramWebApp()

  const mod = await freshModule()
  const seen = []
  const unsubscribe = mod.initFullscreen(({ fullscreen }) => {
    seen.push(fullscreen)
  })

  assert.deepEqual(seen, [true])

  emit(listeners, 'fullscreenChanged', { isFullscreen: false })

  assert.deepEqual(seen, [true, false])

  unsubscribe()
  emit(listeners, 'fullscreenChanged', { isFullscreen: true })

  assert.deepEqual(seen, [true, false])
})
