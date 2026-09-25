import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ux',
  testMatch: ['tap-areas-checkin-offset.spec.mjs'],
  outputDir: 'artifacts/tap-areas/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 1,
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
    trace: 'retain-on-failure',
  },
  projects: [
    {
      // WebKit iPhone 15 Pro — целевое устройство задачи.
      name: 'webkit-iphone-15-pro',
      use: { ...devices['iPhone 15 Pro'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4176',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_LOCAL_PREVIEW: 'true' },
  },
})
