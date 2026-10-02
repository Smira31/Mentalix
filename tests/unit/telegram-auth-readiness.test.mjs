import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const platformSource = await readFile(new URL('../../src/platform/index.js', import.meta.url), 'utf8')
const telegramSource = await readFile(
  new URL('../../src/platform/telegram.adapter.js', import.meta.url),
  'utf8'
)
const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const indexCss = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8')
const catalogSource = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)
const registrySource = await readFile(
  new URL('../../src/lib/practiceCatalogRegistry.js', import.meta.url),
  'utf8'
)


test('Telegram platform detection does not depend only on already-populated initData', () => {
  assert.match(platformSource, /hashHasTelegramData = .*tgWebAppData=/)
  assert.match(platformSource, /telegramBridge = typeof window\.TelegramWebviewProxy/)
  assert.match(platformSource, /standaloneSafari/)
  assert.match(platformSource, /!standaloneSafari/)
})

test('Telegram requestAuth waits for user id AND signed initData before user-owned screens mount', async () => {
  assert.match(telegramSource, /Number\.isSafeInteger\(id\)/)
  assert.match(telegramSource, /id <= 0/)
  assert.match(telegramSource, /timeoutMs = 3000/)
  assert.match(appSource, /const existing = await platform\.requestAuth\(\)/)
  // Вкладки рендерятся только для авторизованного пользователя и
  // без оверлея; видимость определяется активной вкладкой.
  assert.match(appSource, /user && !overlay && \(/)
  assert.match(appSource, /openedTabs\.has\('today'\)/)
  assert.match(appSource, /openedTabs\.has\('practices'\)/)
  assert.match(appSource, /openedTabs\.has\('trends'\)/)

  const webApp = { initDataUnsafe: { user: { id: 123 } }, initData: '' }
  globalThis.__telegramAuthWebApp = webApp
  try {
    const source = telegramSource.replace(
      "import WebApp from '@twa-dev/sdk'",
      'const WebApp = globalThis.__telegramAuthWebApp'
    )
    const { telegramAdapter } = await import(
      `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
    )
    assert.equal(await telegramAdapter.requestAuth({ timeoutMs: 0 }), null)
    assert.equal(await telegramAdapter.requestAuth({ timeoutMs: 3, intervalMs: 1 }), null)

    webApp.initData = 'query_id=signed&hash=signature'
    assert.equal((await telegramAdapter.requestAuth({ timeoutMs: 0 }))?.id, 123)

    webApp.initDataUnsafe.user = null
    assert.equal(await telegramAdapter.requestAuth({ timeoutMs: 0 }), null)
    setTimeout(() => {
      webApp.initDataUnsafe.user = { id: 456 }
    }, 5)
    assert.equal((await telegramAdapter.requestAuth({ timeoutMs: 200, intervalMs: 2 }))?.id, 456)

    webApp.initData = ''
    setTimeout(() => {
      webApp.initData = 'query_id=late&hash=signature'
    }, 5)
    assert.equal((await telegramAdapter.requestAuth({ timeoutMs: 200, intervalMs: 2 }))?.id, 456)
  } finally {
    delete globalThis.__telegramAuthWebApp
  }
})

test('standalone regular screens match Safari while Dialog keeps its safe-area contract', () => {
  assert.match(
    indexCss,
    /@media \(display-mode: standalone\)[\s\S]*\.mx-app-shell:not\(.mx-dialog-app-shell\) \{\s*padding-top: 0 !important;/
  )
  assert.doesNotMatch(indexCss, /\.mx-app-shell:not\(.mx-dialog-app-shell\):not\(.mx-app-shell--fullscreen\)/)
})


test('PR #509 catalog code does not own Telegram initialization or API loading', () => {
  assert.doesNotMatch(catalogSource, /api\.|platform\.|requestAuth/)
  assert.doesNotMatch(registrySource, /fetch\(|api\.|platform\.|requestAuth/)
})
