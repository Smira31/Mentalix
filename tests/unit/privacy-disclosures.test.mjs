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
  assert.ok((settings.match(/title="Политика и данные"/g) || []).length >= 1)
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
  assert.match(policyText, /Файл с твоими данными в формате JSON приходит в чат с ботом/)
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

// ── v1.1: новые пункты ──

test('privacy policy version is 1.1 with correct effective date', () => {
  assert.match(policy, /version:\s*'1\.1'/)
  assert.match(policy, /effectiveDate:\s*'17 октября 2026 г\.'/)
})

test('privacy policy includes payment and subscription data category', () => {
  assert.match(policyText, /Платежи и подписка\. Статус и срок подписки Pro/)
  assert.match(policyText, /Данные банковской карты в Mentalix не поступают/)
  assert.match(policyText, /оплата проходит на стороне платёжных провайдеров/)
})

test('privacy policy Web/PWA paragraph mentions Telegram login without email OTP', () => {
  assert.match(policyText, /пользователь может войти через Telegram и сохранить или перенести прогресс/)
  assert.doesNotMatch(policyText, /email OTP/)
})

test('privacy policy AI section mentions weekly review via GigaChat', () => {
  assert.match(policyText, /Разбор и план недели.*Pro.*записи за неделю могут передаваться GigaChat/)
})

test('privacy policy lists YooKassa and Tribute as payment providers', () => {
  assert.match(policyText, /ЮKassa — приём оплаты на сайте/)
  assert.match(policyText, /Tribute — оплата в Telegram/)
})

test('privacy policy notes Resend is email-only and conditional', () => {
  assert.match(policyText, /Resend — email-инфраструктура; используется, только если пользователь входит по email/)
})

test('privacy policy deletion section describes Telegram code confirmation', () => {
  assert.match(policyText, /подтверждение удаления приходит одноразовым кодом сообщением бота в Telegram/)
  assert.match(policyText, /или на email для аккаунтов с email/)
  assert.match(policyText, /В Telegram Mini App код не нужен/)
})

test('privacy policy deletion section notes payment data retention for accounting', () => {
  assert.match(policyText, /Сведения о платежах могут сохраняться дольше, чем остальные данные/)
  assert.match(policyText, /в объёме, нужном для налогового и бухгалтерского учёта/)
  assert.match(policyText, /не удаляются вместе с аккаунтом/)
})
