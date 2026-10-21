import { defineConfig } from '@playwright/test'

/*
 * Целевой прогон стабильности финала журнала (визуальный скачок после
 * «Сохранить»). Демо-режим (?demo=1) даёт синтетического пользователя,
 * внешних секретов и ручной авторизации не требуется.
 *
 * Только Chromium: WebKit остаётся за CI (см. AGENTS.md, раздел Base44).
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'journal-completion-stability.spec.mjs',
  outputDir: 'artifacts/journal-completion/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4175',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
