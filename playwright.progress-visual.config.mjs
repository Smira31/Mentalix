import { defineConfig } from '@playwright/test'

// Конфиг для visual snapshots экрана «Прогресс» в demo-режиме.
// Отдельный конфиг — обход робота ux-visual (ux-check.spec.mjs),
// который снимает только дефолтную вкладку на mocked fixtures.
// Базовые URL и webServer совпадают с playwright.ux.config.mjs.
export default defineConfig({
  testDir: './tests/ux',
  testMatch: ['progress-tabs-visual.spec.mjs'],
  outputDir: 'artifacts/progress-visual/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
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
