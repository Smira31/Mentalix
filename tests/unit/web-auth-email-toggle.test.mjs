import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const authScreen = readFileSync(
  new URL('../../src/screens/WebAuthScreen.jsx', import.meta.url),
  'utf8'
)
const prodWorkflow = readFileSync(
  new URL('../../.github/workflows/firebase-hosting.yml', import.meta.url),
  'utf8'
)

// Письма с кодом не уходят без своего домена в Resend, поэтому в продакшне
// вход по email скрыт, а основной способ входа на вебе — Telegram Login.
test('вход по email выключается флагом VITE_EMAIL_LOGIN_ENABLED=false', () => {
  assert.match(authScreen, /import\.meta\.env\.VITE_EMAIL_LOGIN_ENABLED !== 'false'/)
  assert.match(authScreen, /\{emailLoginEnabled && \(\s*<section className="mx-web-auth-form"/)
})

test('без email Telegram — основной вход и есть ссылка на бота', () => {
  assert.match(authScreen, /emailLoginEnabled \? 'Или через Telegram' : 'Войти через Telegram'/)
  assert.match(authScreen, /https:\/\/t\.me\/\$\{/)
  assert.match(authScreen, /Открыть Mentalix в Telegram/)
})

test('продакшн-сборка скрывает email и знает имя бота', () => {
  assert.match(prodWorkflow, /VITE_EMAIL_LOGIN_ENABLED: 'false'/)
  assert.match(prodWorkflow, /VITE_TELEGRAM_BOT_USERNAME: Mentalix_club_bot/)
})

const authCss = readFileSync(new URL('../../src/screens/WebAuthScreen.css', import.meta.url), 'utf8')

// Блок Telegram скрыт стилями, пока основной вход — email; без email он должен быть виден.
test('без email блок Telegram виден (класс is-primary снимает display: none)', () => {
  assert.match(authScreen, /mx-web-auth-telegram-card\$\{emailLoginEnabled \? '' : ' is-primary'\}/)
  assert.match(authCss, /\.mx-web-auth-telegram-card\.is-primary\s*\{[^}]*display:\s*flex/)
})
