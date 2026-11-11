import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Issue #1189 — «Почта для входа» в Профиле: условие показа и тексты ошибок.
 * Контракт — GET/POST/DELETE /api/auth/email-link… (бэкенд mentalix-bot #247).
 */

import {
  EMAIL_LINK_ERROR_DELIVERY,
  EMAIL_LINK_ERROR_DISABLED,
  EMAIL_LINK_ERROR_IN_USE,
  EMAIL_LINK_ERROR_INVALID_CODE,
  EMAIL_LINK_ERROR_NETWORK,
  EMAIL_LINK_ERROR_TOO_MANY,
  EMAIL_LINK_UNLINK_CONFIRM_TEXT,
  EMAIL_LINK_UNLINK_CONFIRM_TITLE,
  RESEND_COOLDOWN_SECONDS,
  canSeeEmailLink,
  emailLinkErrorText,
  emailLinkSecondsLeft,
  formatEmailLinkCountdown,
} from '../../src/lib/emailLink.js'

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const libSource = await read('src/lib/emailLink.js')
const rowSource = await read('src/screens/settings/EmailLinkRow.jsx')
const screenSource = await read('src/screens/settings/EmailLinkScreen.jsx')
const screenCss = await read('src/screens/settings/EmailLink.css')
const settingsSource = await read('src/screens/Settings.jsx')
const apiSource = await read('src/lib/api.js')
const demoSource = await read('src/lib/demoMode.js')
const composeSource = await read('docker-compose.base44.yml')

test('строка видна только в Telegram и у настоящего пользователя', () => {
  const user = { id: 900001 }

  assert.equal(canSeeEmailLink({ enabled: true, platform: 'telegram', user }), true)
  // Флаг выключен — строки нет даже в Telegram (дефолт production-сборки).
  assert.equal(canSeeEmailLink({ enabled: false, platform: 'telegram', user }), false)
  // Веб и гость (id <= 0) не меняются.
  assert.equal(canSeeEmailLink({ enabled: true, platform: 'web', user }), false)
  assert.equal(canSeeEmailLink({ enabled: true, platform: 'telegram', user: { id: 0 } }), false)
  assert.equal(canSeeEmailLink({ enabled: true, platform: 'telegram', user: { id: -1 } }), false)
  assert.equal(canSeeEmailLink({ enabled: true, platform: 'telegram', user: null }), false)
})

test('флаг по умолчанию выключен, в песочнице включён', () => {
  assert.match(libSource, /VITE_EMAIL_LINK_ENABLED === 'true'/)
  assert.doesNotMatch(libSource, /VITE_EMAIL_LINK_ENABLED !== 'false'/)
  assert.match(composeSource, /VITE_EMAIL_LINK_ENABLED=true/)
})

test('тексты ошибок совпадают с Issue #1189', () => {
  assert.equal(emailLinkErrorText({ status: 409 }), EMAIL_LINK_ERROR_IN_USE)
  assert.equal(EMAIL_LINK_ERROR_IN_USE, 'Эта почта уже используется. Укажи другую.')
  assert.equal(emailLinkErrorText({ status: 429 }), EMAIL_LINK_ERROR_TOO_MANY)
  assert.equal(EMAIL_LINK_ERROR_TOO_MANY, 'Слишком много попыток. Попробуй позже.')
  assert.equal(EMAIL_LINK_ERROR_INVALID_CODE, 'Код не подошёл. Проверь письмо.')
  // 502/503 — доставка письма не настроена: по задаче свой текст.
  assert.equal(emailLinkErrorText({ status: 502 }), EMAIL_LINK_ERROR_DELIVERY)
  assert.equal(emailLinkErrorText({ status: 503 }), EMAIL_LINK_ERROR_DELIVERY)
  assert.equal(EMAIL_LINK_ERROR_DELIVERY, 'Не получилось отправить письмо. Попробуй позже.')
  // Сеть, таймаут и всё неизвестное — «проверь связь».
  assert.equal(emailLinkErrorText({ kind: 'network' }), EMAIL_LINK_ERROR_NETWORK)
  assert.equal(emailLinkErrorText({ status: 500 }), EMAIL_LINK_ERROR_NETWORK)
  assert.equal(emailLinkErrorText(null), EMAIL_LINK_ERROR_NETWORK)
  assert.equal(EMAIL_LINK_ERROR_NETWORK, 'Не получилось — проверь связь.')
  // 404 email_link_disabled: сервер выключил привязку.
  assert.equal(emailLinkErrorText({ status: 404 }), EMAIL_LINK_ERROR_DISABLED)
})

test('неверный код — ответ 200 с ok:false, а не HTTP-ошибка', () => {
  assert.match(screenSource, /result\?\.ok/)
  assert.match(screenSource, /setError\(EMAIL_LINK_ERROR_INVALID_CODE\)/)
})

test('экран ввода: email, one-time-code и 16 px, фокус через useAutoFocusField', () => {
  assert.match(screenSource, /type="email"/)
  assert.match(screenSource, /inputMode="numeric"/)
  assert.match(screenSource, /autoComplete="one-time-code"/)
  assert.match(screenSource, /useAutoFocusField\(emailRef/)
  assert.match(screenSource, /useAutoFocusField\(codeRef/)
  assert.doesNotMatch(screenSource, /autoFocus=/)
  // Поле ввода 16 px — правило iOS-зума; отступы только токенами.
  assert.match(screenCss, /font-size: 16px/)
  assert.match(screenCss, /var\(--mx-space-/)
  assert.doesNotMatch(screenCss, /padding: \d+px/)
})

test('отсчёт повторной отправки — 60 с от метки времени отправки', () => {
  const now = 1_700_000_000_000
  // Минутный лимит бэкенда: одно письмо в минуту, независимо от срока жизни кода.
  assert.equal(RESEND_COOLDOWN_SECONDS, 60)
  assert.equal(emailLinkSecondsLeft(now + RESEND_COOLDOWN_SECONDS * 1000, now), 60)
  assert.equal(emailLinkSecondsLeft(now + 30_000, now), 30)
  assert.equal(emailLinkSecondsLeft(now - 1, now), 0)
  assert.equal(emailLinkSecondsLeft(0, now), 0)
  assert.equal(formatEmailLinkCountdown(60), '1:00')
  assert.equal(formatEmailLinkCountdown(9), '0:09')
  assert.match(screenSource, /emailLinkSecondsLeft\(cooldownUntil, now\)/)
  assert.match(screenSource, /setCooldownUntil\(sentAt \+ RESEND_COOLDOWN_SECONDS \* 1000\)/)
  // Срок жизни кода (expires_in_minutes) больше не участвует в отсчёте.
  assert.doesNotMatch(screenSource, /expires_in_minutes/)
  assert.doesNotMatch(libSource, /expires_in_minutes/)
})

test('API: новые методы с теми же заголовками, что у остальных запросов', () => {
  assert.match(apiSource, /emailLink: \{/)
  assert.match(apiSource, /get: \(\) => request\('\/auth\/email-link'\)/)
  assert.match(apiSource, /request\('\/auth\/email-link\/request-code'/)
  assert.match(apiSource, /request\('\/auth\/email-link\/verify'/)
  assert.match(apiSource, /request\('\/auth\/email-link', \{ method: 'DELETE' \}\)/)
  assert.match(rowSource, /api\.auth\.emailLink/)
})

test('демо-ответы: код 123456 и занятый адрес taken@example.com', () => {
  assert.match(demoSource, /DEMO_EMAIL_LINK_CODE = '123456'/)
  assert.match(demoSource, /DEMO_EMAIL_LINK_TAKEN = 'taken@example\.com'/)
  assert.match(demoSource, /'\/auth\/email-link\/request-code'/)
  assert.match(demoSource, /'\/auth\/email-link\/verify'/)
  assert.match(demoSource, /invalid_or_expired_code/)
})

test('строка стоит в «твои данные.» и отвязка требует подтверждения', () => {
  assert.match(settingsSource, /<EmailLinkRow user=\{user\} \/>/)
  assert.match(rowSource, /canSeeEmailLink\(\{ enabled: EMAIL_LINK_ENABLED, platform: platformName, user \}\)/)
  assert.match(rowSource, /data-testid="profile-email-link-unlink"/)
  assert.match(rowSource, /<ConfirmDialog/)
  assert.equal(EMAIL_LINK_UNLINK_CONFIRM_TITLE, 'Отвязать почту?')
  assert.equal(EMAIL_LINK_UNLINK_CONFIRM_TEXT, 'Входить на сайте по ней больше не получится.')
  // Пока сервер не ответил, строка не рисуется: ложного «Добавить» нет.
  assert.match(rowSource, /email === undefined\) return null/)
})
