import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ux',
  testMatch: ['react-185-checkin.spec.mjs'],
  outputDir: 'artifacts/react-185-checkin/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'webkit-iphone-15-pro',
      use: { ...devices['iPhone 15 Pro'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4175',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_LOCAL_PREVIEW: 'true' },
  },
})
