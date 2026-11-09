import { defineConfig } from '@playwright/test'

/*
 * ISSUE #1163 — «Выйти из аккаунта» в вебе и PWA.
 *
 * Отдельный конфиг, как у остальных целевых наборов: сценарий поднимает
 * свой dev-сервер на 4181 и не меняет поведение `ux:check`. Флаги оплаты
 * и Pro не нужны, вход по email выключен как в прод-сборке — экран входа
 * после выхода проверяется в той же конфигурации, что у людей.
 * Backend не требуется: ответы /api/** подменяются моками в спеке.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'web-logout.spec.mjs',
  outputDir: 'artifacts/web-logout/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4181',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command:
      'VITE_EMAIL_LOGIN_ENABLED=false VITE_TELEGRAM_BOT_USERNAME=Mentalix_club_bot npm run dev -- --host 127.0.0.1 --port 4181',
    url: 'http://127.0.0.1:4181',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
