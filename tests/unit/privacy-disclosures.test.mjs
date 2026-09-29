import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const settings = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const notice = await readFile(
  new URL('../../src/screens/PrivacyNotice.jsx', import.meta.url),
  'utf8'
)
const policy = await readFile(
  new URL('../../src/content/privacyPolicy.js', import.meta.url),
  'utf8'
)
const policyText = policy.replace(/\\n/g, ' ').replace(/\s+/g, ' ')

test('Settings exposes the privacy and data disclosure to Telegram and web users', () => {
  assert.equal((settings.match(/title="Политика и данные"/g) || []).length, 2)
  assert.match(settings, /setScreen\('privacy-notice'\)/)
  assert.match(settings, /<PrivacyNotice onBack=\{\(\) => setScreen\(null\)\} \/>/)
})

test('PrivacyNotice renders the structured privacy policy from content file', () => {
  assert.match(notice, /from '\.\.\/content\/privacyPolicy'/)
  assert.match(notice, /privacyPolicy\.screenTitle/)
  assert.match(notice, /privacyPolicy\.version/)
  assert.match(notice, /privacyPolicy\.effectiveDate/)
  assert.match(notice, /privacyPolicy\.sections/)
})

test('privacy policy describes deletion boundaries without a false timing promise', () => {
  assert.match(policyText, /Mentalix не утверждает, что все данные удаляются навсегда и немедленно/)
  assert.match(policyText, /Сообщения, уже находящиеся на стороне Telegram, не удаляются Mentalix/)
  assert.match(policyText, /Технические копии в сторонних сервисах.*могут иметь отдельные сроки и правила хранения/)
})

test('privacy policy honestly limits export scope', () => {
  assert.match(policyText, /Не утверждается, что абсолютно все возможные данные.*входят в экспорт/)
  assert.match(policyText, /Markdown\/CSV — данные чек-инов/)
  assert.match(policyText, /Self-service экспорт поддерживается для пользователей, привязавших Telegram-аккаунт/)
})

test('privacy policy disclaims AI as medical or therapeutic service', () => {
  assert.match(policyText, /Mentalix не является психологом, врачом, медицинским или терапевтическим сервисом/)
  assert.match(policyText, /не оказывает медицинской или психотерапевтической помощи/)
})

test('privacy policy states security and age boundaries', () => {
  assert.match(policyText, /абсолютная безопасность не может быть гарантирована ни одним сервисом/)
  assert.match(policyText, /Mentalix не даёт абсолютных обещаний по безопасности/)
  assert.match(policyText, /Mentalix предназначен только для пользователей 18\+/)
})

test('privacy policy does not sell data to advertising services', () => {
  assert.match(policyText, /Mentalix не продаёт данные пользователей и не передаёт их рекламным сервисам/)
})
