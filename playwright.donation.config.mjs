import { defineConfig } from '@playwright/test'

/*
 * Донат («Поддержать проект») через ЮKassa — целевой UX-тест задачи.
 *
 * Экран доната существует только при включённом фронтенд-флаге
 * VITE_PAYMENT_UI_ENABLED=true (src/lib/paymentConfig.js): без флага
 * показывается прежняя заглушка «Оплата скоро появится». Поэтому набор идёт
 * отдельно от `ux:check` со своим dev-сервером на 4180 — общий smoke
 * запускается без флага, его поведение не меняется. Production-сборка флаг
 * не получает. Backend не требуется: ответ /api/donations подменяется моком.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'donation.spec.mjs',
  outputDir: 'artifacts/donation/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4180',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'VITE_PAYMENT_UI_ENABLED=true npm run dev -- --host 127.0.0.1 --port 4180',
    url: 'http://127.0.0.1:4180',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
