import { defineConfig } from '@playwright/test'

/*
 * Issue #1189 — «Почта для входа» в Профиле.
 *
 * Целевой набор живёт своим конфигом, как остальные целевые проверки:
 * полный ux:check и WebKit остаются CI. Отдельный dev-сервер нужен из-за
 * VITE_EMAIL_LINK_ENABLED: без флага строки нет вовсе, а общий ux:check
 * запускается без него. Демо-режим (?demo=1) даёт пользователя и ответы
 * /auth/email-link без backend, платформа Telegram — TelegramWebviewProxy.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'email-link.spec.mjs',
  outputDir: 'artifacts/email-link/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4184',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4184',
    url: 'http://127.0.0.1:4184',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_EMAIL_LINK_ENABLED: 'true' },
  },
})
