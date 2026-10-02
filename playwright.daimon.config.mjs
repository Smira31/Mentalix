import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/ux',
  testMatch: ['daimon-flow.spec.mjs', 'daimon-edge-cases.spec.mjs'],
  projects: [{ name: 'chromium' }, { name: 'webkit', use: { browserName: 'webkit' } }],
  outputDir: 'artifacts/daimon-flow/playwright-output',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 8_000,
  },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
