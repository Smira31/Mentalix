import { defineConfig } from '@playwright/test'

/*
 * Целевой прогон задачи fix-scroll-overflow: искусственная прокрутка и
 * нестабильное поведение коротких экранов Mentalix.
 *
 * Демо-режим (?demo=1) даёт синтетического пользователя, поэтому внешних
 * секретов и ручной авторизации не требуется.
 *
 * Только Chromium: WebKit остаётся за CI (см. AGENTS.md, раздел Base44).
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'scroll-overflow.spec.mjs',
  outputDir: 'artifacts/scroll-overflow/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
