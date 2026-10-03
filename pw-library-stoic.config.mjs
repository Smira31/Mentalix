import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'library-read-opens-catalog.spec.mjs',
  outputDir: '/tmp/mentalix-library-test-results',
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    viewport: { width: 430, height: 932 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  },
})
