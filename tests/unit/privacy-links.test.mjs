import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * Unit-контракт: ссылка «Политика конфиденциальности» есть на экране входа
 * (WebAuthScreen) и на экране «Подписка» (SubscriptionManager), а Settings
 * передаёт onOpenPrivacy в SubscriptionManager.
 */

const webAuthSource = await readFile(
  new URL('../../src/screens/WebAuthScreen.jsx', import.meta.url),
  'utf8'
)
const subscriptionSource = await readFile(
  new URL('../../src/screens/SubscriptionManager.jsx', import.meta.url),
  'utf8'
)
const settingsSource = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)

test('WebAuthScreen содержит ссылку на политику конфиденциальности', () => {
  assert.match(
    webAuthSource,
    /data-testid="web-auth-privacy-link"/,
    'на экране входа есть data-testid="web-auth-privacy-link"'
  )
  assert.match(webAuthSource, /Политика конфиденциальности/)
  assert.match(webAuthSource, /href="\/privacy"/)
})

test('SubscriptionManager содержит ссылку на политику рядом с кнопкой оплаты', () => {
  assert.match(
    subscriptionSource,
    /data-testid="subscription-privacy-link"/,
    'на экране подписки есть data-testid="subscription-privacy-link"'
  )
  assert.match(subscriptionSource, /Политика конфиденциальности/)
  assert.match(subscriptionSource, /onOpenPrivacy/)
})

test('Settings передаёт onOpenPrivacy в SubscriptionManager', () => {
  assert.match(
    settingsSource,
    /onOpenPrivacy=\{\(\) => setScreen\('privacy-notice'\)\}/,
    'Settings передаёт onOpenPrivacy, открывающий экран PrivacyNotice'
  )
})
