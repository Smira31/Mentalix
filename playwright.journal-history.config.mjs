import { defineConfig } from '@playwright/test'

// JOURNAL-001: профильная изоляция поверхности «История» (Прогресс → История).
// Смена профиля полной загрузкой (?demo=1&guest=1) — journal-history-profile-isolation;
// смена пропа user в живом React-дереве на настоящих компонентах — journal-history-component-isolation.
// Базовый URL и webServer — как в playwright.ux.config.mjs; запуск:
// npx playwright test --config=playwright.journal-history.config.mjs
export default defineConfig({
  testDir: './tests/ux',
  testMatch: [
    'journal-history-profile-isolation.spec.mjs',
    'journal-history-component-isolation.spec.mjs',
  ],
  outputDir: 'artifacts/journal-history/playwright-output',
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
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
