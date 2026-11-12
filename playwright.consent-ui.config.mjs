import { defineConfig } from '@playwright/test'

/*
 * «Доступ ИИ к записям»: переключатель и окно согласия в группе «Приватность»
 * профиля. В «Диалоге» поверхности согласия нет — это тоже проверяется здесь.
 *
 * Сценарий живёт отдельным конфигом, как остальные целевые наборы: полный
 * ux:check и WebKit остаются CI. Демо-режим (?demo=1) даёт пользователя и
 * чат без backend, платформа Telegram включается подменой TelegramWebviewProxy
 * — без неё переключатель по условию задачи не показывается вовсе.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'ai-consent-ui.spec.mjs',
  outputDir: 'artifacts/ai-consent-ui/playwright-output',
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
    command: 'npm run dev -- --host 127.0.0.1 --port 4182',
    url: 'http://127.0.0.1:4182',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
