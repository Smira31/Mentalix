import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ux',
  testMatch: ['swipe-gestures.spec.mjs', 'webkit-scroll-back.spec.mjs'],
  outputDir: 'artifacts/swipe-check/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
  expect: {
    timeout: 8_000,
  },
  reporter: 'line',
  use: {
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        baseURL: 'http://127.0.0.1:3000',
      },
    },
    {
      name: 'webkit-iphone-15-pro',
      use: {
        baseURL: 'http://127.0.0.1:3000',
        ...devices['iPhone 15 Pro'],
        reducedMotion: 'no-preference',
      },
    },
    {
      name: 'webkit-iphone-15-pro-max',
      use: {
        baseURL: 'http://127.0.0.1:3000',
        ...devices['iPhone 15 Pro Max'],
        reducedMotion: 'no-preference',
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
