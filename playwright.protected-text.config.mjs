import { defineConfig } from '@playwright/test'

// Целевой gate задачи #1112 (этап 1): защита текстов от копирования.
// Полный ux:check и WebKit — CI. Команда: npm run ux:protected-text.
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'protected-text.spec.mjs',
  outputDir: 'artifacts/protected-text/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
  expect: {
    timeout: 8_000,
  },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4182',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4182',
    url: 'http://127.0.0.1:4182',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
