import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const authScreen = await readFile(new URL('../../src/screens/WebAuthScreen.jsx', import.meta.url), 'utf8')
const api = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const adapter = await readFile(new URL('../../src/platform/web.adapter.js', import.meta.url), 'utf8')

 test('production web auth exposes email OTP and Telegram Login without demo mode', () => {
  assert.match(authScreen, /requestEmailCode/)
  assert.match(authScreen, /telegramLogin/)
  assert.match(authScreen, /telegram-widget\.js/)
  assert.doesNotMatch(authScreen, /DEMO_USER|demoRequest/)
})

test('web adapter restores server session and sends cookie credentials', () => {
  assert.match(adapter, /apiBase.*\/api/)
  assert.match(adapter, /\/auth\/session/)
  assert.match(adapter, /credentials: 'include'/)
  assert.match(api, /credentials: 'include'/)
})

test('web auth restore has a finite timeout for standalone Safari', () => {
  assert.match(adapter, /AbortController/)
  assert.match(adapter, /setTimeout\(\(\) => controller\.abort\(\), 7000\)/)
  assert.match(adapter, /signal: controller\.signal/)
})
