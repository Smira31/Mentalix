import { defineConfig } from '@playwright/test'

// Конфиг регрессии видимости сегмента «Аналитика | История» на «Прогрессе»
// в двух режимах: компактное окно Telegram (frame=0, sticky) и демо-рамка
// (эмуляция Telegram fullscreen, сегмент вынесен в шапку).
// Базовые URL и webServer совпадают с playwright.ux.config.mjs.
export default defineConfig({
  testDir: './tests/ux',
  testMatch: ['progress-segment-visibility.spec.mjs'],
  outputDir: 'artifacts/progress-segment/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
  expect: {
    timeout: 8_000,
  },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
