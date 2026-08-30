import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'mxl-246-journal-responsive.spec.mjs',
  outputDir: 'artifacts/mxl-246-journal-responsive/playwright-output',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 8_000,
  },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4176',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4176',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
