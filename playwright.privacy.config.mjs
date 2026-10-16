import { defineConfig } from '@playwright/test'

/*
 * «Мои данные» в Профиль → Настройки — целевой UX-тест задачи.
 *
 * Раздел приватности (скачивание, отправка в Telegram, удаление аккаунта
 * с одноразовым кодом) не требует отдельного флага — доступен в обычной
 * dev-сборке. Backend не нужен: ответы /api/privacy/* подменяются моком.
 * Полный ux:check и WebKit остаются CI.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'privacy-data.spec.mjs',
  outputDir: 'artifacts/privacy/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
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
    command: 'npm run dev -- --host 127.0.0.1 --port 4181',
    url: 'http://127.0.0.1:4181',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
