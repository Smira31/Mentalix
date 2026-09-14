import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'telegram-p0-check.spec.mjs',
  outputDir: 'artifacts/telegram-p0-check/playwright-output',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
