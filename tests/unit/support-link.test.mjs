import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../../src/${path}`, import.meta.url), 'utf8')

test('адрес поддержки задан одной константой SUPPORT_TELEGRAM', async () => {
  const source = await read('lib/support.js')
  assert.match(source, /export const SUPPORT_TELEGRAM = 'smira31'/)
  assert.match(source, /`https:\/\/t\.me\/\$\{SUPPORT_TELEGRAM\}`/)
  assert.match(source, /platform\.openTelegramLink\(SUPPORT_TELEGRAM_URL\)/)
})

test('профиль и «политика и данные.» используют константу поддержки', async () => {
  const settings = await read('screens/Settings.jsx')
  const privacy = await read('screens/PrivacyNotice.jsx')
  assert.match(settings, /from '\.\.\/lib\/support'/)
  assert.match(settings, /openSupportChat\(\)/)
  assert.match(privacy, /href=\{SUPPORT_TELEGRAM_URL\}/)
  assert.match(privacy, /onClick=\{openSupportChat\}/)
  for (const source of [settings, privacy]) {
    assert.doesNotMatch(source, /t\.me\/mentalix_support_bot/)
  }
})

test('в Telegram ссылка открывается через openTelegramLink, в вебе — новой вкладкой', async () => {
  const telegram = await read('platform/telegram.adapter.js')
  const web = await read('platform/web.adapter.js')
  assert.match(telegram, /WebApp\.openTelegramLink\(url\)/)
  assert.match(web, /openTelegramLink\(url\)\s*\{\s*window\.open\(url, '_blank'/)
})
