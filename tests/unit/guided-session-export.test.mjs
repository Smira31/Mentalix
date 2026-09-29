import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const settings = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const policy = await readFile(
  new URL('../../src/content/privacyPolicy.js', import.meta.url),
  'utf8'
)
const policyText = policy.replace(/\\n/g, ' ').replace(/\s+/g, ' ')

test('JSON export entry honestly names completed guided sessions', () => {
  assert.match(settings, /title="Экспорт JSON"/)
  assert.match(settings, /Часть данных: профиль, чек-ины, завершённые направленные записи/)
})

test('privacy policy export section covers supported data honestly', () => {
  assert.match(policyText, /JSON — расширенный экспорт поддерживаемого scope данных Mentalix/)
  assert.match(policyText, /Markdown\/CSV — данные чек-инов/)
  assert.match(policyText, /Экспорт покрывает поддерживаемые данные Mentalix/)
  assert.match(policyText, /Не утверждается, что абсолютно все возможные данные.*входят в экспорт/)
})

test('privacy policy export section names Telegram-only self-service boundary', () => {
  assert.match(policyText, /Self-service экспорт поддерживается для пользователей, привязавших Telegram-аккаунт/)
  assert.match(policyText, /Для гостевых и email-only пользователей self-service экспорт может быть недоступен/)
})
