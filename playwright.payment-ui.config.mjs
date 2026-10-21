import { defineConfig } from '@playwright/test'

/*
 * PAY-UI-001 — состояния экрана «Подписка» (guest/base/pro/success/expired/
 * pending), возврат с ЮKassa (?payment=return) и вход «Оформить Pro» из
 * карточки «Прогресс».
 *
 * Экраны состояний существуют только при включённом фронтенд-флаге
 * VITE_PAYMENT_UI_ENABLED=true (src/lib/paymentConfig.js): без флага
 * показывается прежний статичный экран, и проверки состояний падают.
 * Карточка «Разбор и план недели» в «Прогрессе» — за своим флагом
 * VITE_PRO_REVIEW_PLAN_ENABLED=true.
 *
 * Поэтому набор идёт отдельно от `ux:check` со своим dev-сервером на 4179:
 * общий smoke запускается без флагов, его поведение не меняется.
 * Production-сборка флагов не получает — выключены по умолчанию.
 * Backend не требуется: состояние задаётся dev-параметром `?demo=1&payState=…`,
 * ответ /api/subscription в сценарии возврата подменяется моком.
 *
 * Остальные переменные — как в продакшн-сборке (.github/workflows/firebase-hosting.yml):
 * вход по email выключен (нет своего домена в Resend), имя бота для Telegram
 * Login задано. Так экран гостя проверяется в той же конфигурации, что у людей.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'subscription-states.spec.mjs',
  outputDir: 'artifacts/payment-ui/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4179',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command:
      'VITE_PAYMENT_UI_ENABLED=true VITE_PRO_REVIEW_PLAN_ENABLED=true VITE_EMAIL_LOGIN_ENABLED=false VITE_TELEGRAM_BOT_USERNAME=Mentalix_club_bot npm run dev -- --host 127.0.0.1 --port 4179',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
