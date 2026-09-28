import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: "/app/artifacts/geo",
  testMatch: "geo.spec.mjs",
  outputDir: '/app/artifacts/geo/out',
  workers: 1,
  timeout: 300_000,
  use: { baseURL: 'http://127.0.0.1:4173', colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block', trace: 'off', video: 'off' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 120_000 },
  reporter: 'line',
})
