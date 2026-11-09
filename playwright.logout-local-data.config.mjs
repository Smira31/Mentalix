import { defineConfig } from '@playwright/test'

/*
 * ISSUE #1166 — «Выйти» стирает личные данные с устройства.
 *
 * Отдельный конфиг, как у web-logout (#1163): свой dev-сервер на 4182 и
 * никакого влияния на `ux:check`. Вход по email выключен как в прод-сборке,
 * backend не нужен — ответы /api/** подменяются моками в спеке.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'logout-local-data.spec.mjs',
  outputDir: 'artifacts/logout-local-data/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4182',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command:
      'VITE_EMAIL_LOGIN_ENABLED=false VITE_TELEGRAM_BOT_USERNAME=Mentalix_club_bot npm run dev -- --host 127.0.0.1 --port 4182',
    url: 'http://127.0.0.1:4182',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
