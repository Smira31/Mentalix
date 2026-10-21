import { defineConfig } from '@playwright/test'

/*
 * Витрина Pro: карточка «Разбор и план недели» видна всем — гостям и
 * пользователям без Pro. Тап ведёт к оплате (экран «Подписка»), у Pro —
 * прежняя карточка с запросом GET /api/pro/report.
 *
 * Флаги VITE_PRO_REVIEW_PLAN_ENABLED=true и VITE_PAYMENT_UI_ENABLED=true
 * нужны, чтобы карточка и кнопка оплаты существовали. VITE_PRO_MOCK=ready
 * мокает /api/pro/report для проверки карточки Pro. Backend не требуется.
 *
 * Запуск в web-контейнере:
 *   npx playwright test --config=playwright.pro-showcase.config.mjs
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'pro-showcase.spec.mjs',
  outputDir: 'artifacts/pro-showcase/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4181',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command:
      'VITE_PRO_REVIEW_PLAN_ENABLED=true VITE_PAYMENT_UI_ENABLED=true VITE_PRO_MOCK=ready VITE_EMAIL_LOGIN_ENABLED=false VITE_TELEGRAM_BOT_USERNAME=Mentalix_club_bot npm run dev -- --host 127.0.0.1 --port 4181',
    url: 'http://127.0.0.1:4181',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
