import { defineConfig } from '@playwright/test'

/*
 * PRO-002b/c — регрессии недоступного/некорректного ответа API Pro.
 *
 * Отдельный набор от `ux:pro-states`: тот снимает доказательства состояний и
 * отклоняет повторяющиеся кадры, а здесь проверяются отказы (сеть, ответ без
 * состояния Pro, отсутствующие и нераспознанные даты недели) — им нужны свои
 * утверждения, а не кадр.
 *
 * Без backend: работает dev-only mock `?proMock=…` (src/lib/proMock.js),
 * флаг VITE_PRO_REVIEW_PLAN_ENABLED=true нужен, чтобы вложенный экран Pro
 * существовал.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'pro-failure-states.spec.mjs',
  outputDir: 'artifacts/pro-failure-states/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4178',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command:
      'VITE_PRO_REVIEW_PLAN_ENABLED=true npm run dev -- --host 127.0.0.1 --port 4178',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
