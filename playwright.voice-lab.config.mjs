import { defineConfig } from '@playwright/test'

/*
 * Этап 0 «Голос»: скрытая лаборатория записи микрофона.
 *
 * Свой конфиг, как у остальных целевых проверок: полный ux:check и WebKit
 * остаются в CI. Реальную запись в CI не проверить (нет микрофона) — этот
 * сценарий в отчёте идёт как NOT RUN; здесь проверяются скрытый вход и
 * аккуратный отказ без поддержки микрофона.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'voice-lab.spec.mjs',
  outputDir: 'artifacts/voice-lab/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4185',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4185',
    url: 'http://127.0.0.1:4185',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
