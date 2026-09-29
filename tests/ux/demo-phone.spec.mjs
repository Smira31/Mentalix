import { expect, test } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173'

test.describe('demo preview: phone vs desktop', () => {
  test('телефон 393 в демо-режиме — нет toolbar, нет фрейма, нет имитации шапки', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 393, height: 852 },
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })

    // В демо-режиме API перехватывается демо-данными (demoRequest в demoMode.js),
    // но на всякий случай блокируем внешние запросы.
    await context.route('**/api/**', route => {
      // demoMode перехватывает api-вызовы до сети — если дошли сюда, отвечаем пустым.
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    const page = await context.newPage()
    await page.goto('/?demo=1')

    // Дождаться загрузки приложения — кнопка нижней навигации
    await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible({ timeout: 15_000 })

    // Нет переключателя Demo viewport
    await expect(page.locator('.mx-preview-device-switcher')).toHaveCount(0)

    // Нет фрейма устройства (mx-preview-stage)
    await expect(page.locator('.mx-preview-stage')).toHaveCount(0)

    // Нет имитации шапки Telegram
    await expect(page.locator('.mx-demo-telegram-chrome')).toHaveCount(0)

    // Приложение занимает полную ширину экрана (не 393/440px фиксированно)
    const appShell = page.locator('[data-mentalix-demo-frame]').first()
    if ((await appShell.count()) > 0) {
      const box = await appShell.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(390)
    }

    await context.close()
  })

  test('телефон 393 + ?toolbar=1 — переключатель виден', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 393, height: 852 },
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    await context.route('**/api/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    const page = await context.newPage()
    await page.goto('/?demo=1&toolbar=1')

    await expect(page.locator('.mx-preview-device-switcher')).toBeVisible({ timeout: 15_000 })

    await context.close()
  })

  test('десктоп 1280 в демо-режиме — toolbar и фрейм есть', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 800 },
      isMobile: false,
      hasTouch: false,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    await context.route('**/api/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    const page = await context.newPage()
    await page.goto('/?demo=1')

    // Дождаться загрузки
    await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible({ timeout: 15_000 })

    // Переключатель Demo viewport виден
    await expect(page.locator('.mx-preview-device-switcher')).toBeVisible()

    // Фрейм устройства есть
    await expect(page.locator('.mx-preview-stage')).toHaveCount(1)

    // Имитация шапки Telegram есть
    await expect(page.locator('.mx-demo-telegram-chrome')).toBeVisible()

    await context.close()
  })

  test('десктоп 1280 + ?frame=0 — фрейм выключен', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 800 },
      isMobile: false,
      hasTouch: false,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    await context.route('**/api/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    const page = await context.newPage()
    await page.goto('/?demo=1&frame=0')

    await expect(page.getByRole('button', { name: 'Шаги' })).toBeVisible({ timeout: 15_000 })

    // Фрейм устройства выключен
    await expect(page.locator('.mx-preview-stage')).toHaveCount(0)

    // Переключатель всё ещё виден (frame=0 не отключает toolbar)
    await expect(page.locator('.mx-preview-device-switcher')).toBeVisible()

    await context.close()
  })
})
