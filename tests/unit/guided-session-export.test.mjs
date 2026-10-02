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

test('single export entry honestly names JSON and completed guided sessions', () => {
  assert.match(settings, /'Отправить мои данные в чат'/)
  assert.match(settings, /Файл JSON: профиль, чек-ины, завершённые направленные записи/)
  assert.doesNotMatch(settings, /Экспорт Markdown|Экспорт CSV/)
})

test('privacy policy export section covers supported data honestly', () => {
  assert.match(policyText, /Файл с твоими данными в формате JSON приходит в чат с ботом/)
  assert.match(policyText, /расширенный экспорт поддерживаемого scope данных Mentalix/)
  assert.match(policyText, /Экспорт покрывает поддерживаемые данные Mentalix/)
  assert.match(policyText, /Не утверждается, что абсолютно все возможные данные.*входят в экспорт/)
})

test('privacy policy export section names Telegram-only self-service boundary', () => {
  assert.match(policyText, /Self-service экспорт поддерживается для пользователей, привязавших Telegram-аккаунт/)
  assert.match(policyText, /Для гостевых и email-only пользователей self-service экспорт может быть недоступен/)
})
