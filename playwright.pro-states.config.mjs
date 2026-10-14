import { defineConfig } from '@playwright/test'

/*
 * PRO-002b/c — доказательная съёмка экранов Mentalix Pro.
 *
 * Фронтенд-флаг VITE_PRO_REVIEW_PLAN_ENABLED=true нужен, чтобы строка
 * «Разбор недели» и сам вложенный экран существовали: production-сборка
 * флага не получает (src/lib/proFlag.js). Backend не требуется — работает
 * dev-only mock `?proMock=…` (src/lib/proMock.js).
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'pro-review-states.spec.mjs',
  outputDir: 'artifacts/pro-states/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4177',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command:
      'VITE_PRO_REVIEW_PLAN_ENABLED=true npm run dev -- --host 127.0.0.1 --port 4177',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
