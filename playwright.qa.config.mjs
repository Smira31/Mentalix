import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/qa',
  testMatch: ['crawl.spec.mjs'],
  outputDir: 'artifacts/qa-crawl/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 600_000,
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
