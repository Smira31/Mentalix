import { defineConfig } from '@playwright/test'

/*
 * PAY-UI-001 — состояния экрана «Подписка» (guest/base/pro/pending/expired).
 *
 * Экраны состояний существуют только при включённом фронтенд-флаге
 * VITE_PAYMENT_UI_ENABLED=true (src/lib/paymentConfig.js): без флага
 * показывается прежний статичный экран, и проверки состояний падают.
 *
 * Поэтому набор идёт отдельно от `ux:check` со своим dev-сервером на 4179:
 * общий smoke запускается без флага, его поведение не меняется.
 * Production-сборка флаг не получает — выключен по умолчанию.
 * Backend не требуется: состояние задаётся dev-параметром `?demo=1&payState=…`.
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
    command: 'VITE_PAYMENT_UI_ENABLED=true npm run dev -- --host 127.0.0.1 --port 4179',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
