import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const platformSource = await readFile(new URL('../../src/platform/index.js', import.meta.url), 'utf8')
const telegramSource = await readFile(
  new URL('../../src/platform/telegram.adapter.js', import.meta.url),
  'utf8'
)
const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
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
  assert.match(platformSource, /initData \|\| hashHasTelegramData \|\| telegramBridge/)
})

test('Telegram requestAuth waits for a valid user id before App mounts user-scoped screens', () => {
  assert.match(telegramSource, /Number\.isSafeInteger\(id\)/)
  assert.match(telegramSource, /id <= 0/)
  assert.match(telegramSource, /timeoutMs = 3000/)
  assert.match(telegramSource, /while \(!user && Date\.now\(\) < deadline\)/)
  assert.match(appSource, /const existing = await platform\.requestAuth\(\)/)
  assert.match(appSource, /user && tab === 'today'/)
  assert.match(appSource, /user && tab === 'practices'/)
  assert.match(appSource, /user && tab === 'trends'/)
})


test('PR #509 catalog code does not own Telegram initialization or API loading', () => {
  assert.doesNotMatch(catalogSource, /api\.|platform\.|requestAuth/)
  assert.doesNotMatch(registrySource, /fetch\(|api\.|platform\.|requestAuth/)
})
