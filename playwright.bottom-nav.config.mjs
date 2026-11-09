import { defineConfig } from '@playwright/test'

/*
 * Целевой прогон задачи tabbar-lower-collapse: нижний бар ниже, на всех пяти
 * вкладках сжимается при скролле вниз и раскрывается вверх/по тапу.
 *
 * Демо-режим (?demo=1) даёт синтетического пользователя, поэтому внешних
 * секретов и ручной авторизации не требуется.
 *
 * Целевой движок — WebKit (iOS PWA / Telegram на iPhone); Chromium прогоняется
 * для быстрой обратной связи, но решает WebKit.
 */
export default defineConfig({
  testDir: './tests/ux',
  testMatch: 'bottom-nav-collapse.spec.mjs',
  outputDir: 'artifacts/bottom-nav-collapse/playwright-output',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 8_000 },
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
    // Порт 5173 — обычный dev-сервер проекта. Уже запущенный (в песочнице
    // Base44 его держит compose) переиспользуется: второй Vite в том же
    // node_modules пишет общий кэш и перезагружает страницу прямо в тесте.
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
