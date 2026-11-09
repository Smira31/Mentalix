import { defineConfig } from '@playwright/test'

// Целевой gate задачи #1165: вне Telegram с экранов «Пути героя» и шага курса
// возвращает видимая «Назад». Полный ux:check и WebKit остаются CI.
// Команда: npm run ux:hero-back.
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'hero-journey-back.spec.mjs',
  outputDir: 'artifacts/hero-back/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
  expect: {
    timeout: 8_000,
  },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4184',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4184',
    url: 'http://127.0.0.1:4184',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
