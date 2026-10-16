import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  ERASURE_HINTS,
  ERASURE_INIT_DATA_SUFFICIENT,
  ERASURE_REQUEST_ERRORS,
  erasureDeliveryHint,
  erasureDeliveryMethod,
  erasureRequestErrorText,
  erasureRequestReason,
} from '../../src/lib/erasureCode.js'

/*
 * Разбор кодов ответа POST /api/privacy/account-erasure/request-code.
 * Модуль чистый (без platform/api), поэтому импортируется напрямую и
 * проверяется настоящим поведением, а не текстом исходника.
 */

const apiSource = fs.readFileSync(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const settingsSource = fs.readFileSync(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)

test('канал доставки из успешного ответа: email, telegram или неизвестный', () => {
  assert.equal(erasureDeliveryMethod({ ok: true, delivery_method: 'email' }), 'email')
  assert.equal(erasureDeliveryMethod({ ok: true, sent_via: 'telegram' }), 'telegram')
  assert.equal(erasureDeliveryMethod({ ok: true, channel: 'telegram' }), 'telegram')
  // Канал не назван или назван нераспознанно — догадок не делаем.
  assert.equal(erasureDeliveryMethod({ ok: true }), null)
  assert.equal(erasureDeliveryMethod({ ok: true, delivery_method: 'sms' }), null)
  assert.equal(erasureDeliveryMethod(null), null)
})

test('подсказка: известный канал — точнее, неизвестный — нейтральная', () => {
  assert.equal(erasureDeliveryHint('email'), 'Код подтверждения отправлен на email.')
  assert.equal(erasureDeliveryHint('telegram'), 'Код подтверждения отправлен в чат с Mentalix.')
  assert.equal(erasureDeliveryHint(null), 'Код подтверждения придёт в Telegram или на email.')
  assert.equal(erasureDeliveryHint('sms'), ERASURE_HINTS.unknown)
})

test('429 (все три лимита) — «Слишком часто. Попробуй чуть позже»', () => {
  for (const detail of ['email_minute_limit', 'email_hour_limit', 'too_many_email_requests']) {
    const reason = erasureRequestReason({ status: 429, body: { detail } })
    assert.equal(reason, 'rate_limited')
    assert.equal(erasureRequestErrorText(reason), 'Слишком часто. Попробуй чуть позже')
  }
})

test('502 — ошибка отправки в Telegram, с подсказкой открыть бота', () => {
  const reason = erasureRequestReason({ status: 502, body: { detail: 'telegram_send_failed' } })
  assert.equal(reason, 'telegram_send_failed')
  assert.equal(
    erasureRequestErrorText(reason),
    'Не удалось отправить код в Telegram. Открой чат с ботом Mentalix, нажми Start и попробуй снова'
  )
})

test('503 — отправка недоступна, с советом написать в поддержку', () => {
  const reason = erasureRequestReason({ status: 503, body: { detail: null } })
  assert.equal(reason, 'telegram_delivery_not_configured')
  assert.equal(
    erasureRequestErrorText(reason),
    'Отправка кода сейчас недоступна. Напиши в поддержку'
  )
})

test('409 — различаем «некуда отправить» и Mini App (код не нужен)', () => {
  const noChannel = erasureRequestReason({
    status: 409,
    body: { detail: 'no_delivery_channel' },
  })
  assert.equal(noChannel, 'no_delivery_channel')
  assert.equal(
    erasureRequestErrorText(noChannel),
    'Не нашли, куда отправить код. Напиши в поддержку'
  )

  // detail приходит от бэкенда дословно — сверяем именно литерал ответа,
  // а не собственную константу с самой собой.
  assert.equal(ERASURE_INIT_DATA_SUFFICIENT, 'telegram_init_data_sufficient')
  assert.equal(
    erasureRequestReason({
      status: 409,
      body: { detail: 'telegram_init_data_sufficient' },
    }),
    ERASURE_INIT_DATA_SUFFICIENT
  )
  // Неизвестный 409 не выдаём за «некуда отправить».
  assert.equal(erasureRequestReason({ status: 409, body: { detail: 'other' } }), 'failed')
})

test('неизвестная ошибка (сеть, 400, 500, без статуса) — общее сообщение', () => {
  for (const error of [
    { status: 500, body: {} },
    { status: 400, body: { detail: 'bad_request' } },
    { kind: 'network' },
    new Error('boom'),
    undefined,
  ]) {
    const reason = erasureRequestReason(error)
    assert.equal(reason, 'failed')
    assert.equal(erasureRequestErrorText(reason), 'Не получилось. Попробуй ещё раз')
  }
  assert.equal(erasureRequestErrorText('unknown_reason'), ERASURE_REQUEST_ERRORS.failed)
})

test('каждой причине отказа соответствует свой текст', () => {
  const texts = Object.values(ERASURE_REQUEST_ERRORS)
  assert.equal(new Set(texts).size, texts.length)
})

test('api.requestErasureCode разбирает коды модулем и не бросает ошибку наружу', () => {
  const block = apiSource.match(/requestErasureCode:[\s\S]*?\n\s{4}\},/)
  assert.ok(block, 'метод requestErasureCode найден в api.js')
  assert.match(block[0], /erasureDeliveryMethod/)
  assert.match(block[0], /erasureRequestReason/)
  assert.match(block[0], /ok: true/)
  assert.match(block[0], /ok: false, reason/)
  // Ошибку глотаем: экран получает причину, а не исключение.
  assert.match(block[0], /catch/)
})

test('Settings показывает тексты модуля, а не свои догадки о канале', () => {
  assert.match(settingsSource, /erasureDeliveryHint\(/)
  assert.match(settingsSource, /erasureRequestErrorText\(/)
  assert.match(settingsSource, /ERASURE_INIT_DATA_SUFFICIENT/)
  // Прежняя формулировка «код отправлен» без канала больше не встречается.
  assert.doesNotMatch(settingsSource, /'Код подтверждения отправлен\.'/)
  assert.doesNotMatch(settingsSource, /отправлен на ваш email/)
})
