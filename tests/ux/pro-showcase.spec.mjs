import { test, expect } from '@playwright/test'

/*
 * Витрина Pro: карточка «Разбор и план недели» видна всем.
 *
 * Проверяет:
 *  1) у гостя и пользователя без Pro карточка видна, запросов к /api/pro/*
 *     нет, тап открывает «Подписку»;
 *  2) у Pro — прежняя карточка с запросом GET /api/pro/report.
 *
 * Флаги VITE_PRO_REVIEW_PLAN_ENABLED=true и VITE_PAYMENT_UI_ENABLED=true
 * задаёт конфиг (playwright.pro-showcase.config.mjs). Backend не нужен:
 * в демо-режиме (?demo=1) /api/subscription отвечает без Pro (has_pro=false),
 * а ?proStatus=pro переопределяет статус для проверки карточки Pro.
 *
 * Обращения к /api/pro/* считает сам dev-мок Pro (VITE_PRO_MOCK=ready): он
 * перехватывает вызов внутри api.js (src/lib/api.js) до сети, поэтому
 * page.on('request') их не видит. Достоверный признак обращения — счётчик
 * мока window.__mxProMockGets.
 *
 * Запуск в web-контейнере:
 *   npx playwright test --config=playwright.pro-showcase.config.mjs
 */

const BASE = 'http://127.0.0.1:4181'

/** Сколько раз dev-мок Pro ответил на GET /pro/* (0 — обращений не было). */
function proMockGets(page) {
  return page.evaluate(() => window.__mxProMockGets || 0)
}

test.describe('Витрина Pro в аналитике', () => {
  test('гость: карточка видна, запросов к /api/pro/* нет, тап открывает подписку', async ({
    page,
  }) => {
    await page.goto(`${BASE}/?demo=1&guest=1&tab=trends`)

    // Карточка витрины видна.
    const showcase = page.getByTestId('progress-pro-showcase')
    await expect(showcase).toBeVisible()

    // Заголовок и бейдж «Pro».
    await expect(page.getByText('Разбор и план недели').first()).toBeVisible()
    await expect(showcase.locator('.mx-pro-showcase-card__badge')).toHaveText('Pro')

    // Витрина — не состояние разбора: статуса «Разбор готов» в ней нет.
    await expect(showcase).not.toContainText('Разбор готов')

    // Кнопка «Открыть Pro» видна (PAYMENT_UI_ENABLED=true в конфиге).
    const openButton = page.getByTestId('pro-showcase-open')
    await expect(openButton).toBeVisible()

    // Обращений к /api/pro/* не было.
    expect(await proMockGets(page), 'не должно быть запросов к /api/pro/* у гостя').toBe(0)

    // Тап открывает экран «Подписка».
    await openButton.click()
    await expect(page.getByTestId('profile-page-title')).toHaveText('подписка.')
  })

  test('не-Pro: карточка видна, запросов к /api/pro/* нет, тап открывает подписку', async ({
    page,
  }) => {
    await page.goto(`${BASE}/?demo=1&tab=trends`)

    // Карточка витрины видна (не-Pro пользователь в демо).
    const showcase = page.getByTestId('progress-pro-showcase')
    await expect(showcase).toBeVisible()

    // Витрина — не состояние разбора: статуса «Разбор готов» в ней нет.
    await expect(showcase).not.toContainText('Разбор готов')

    // Кнопка «Открыть Pro» видна.
    const openButton = page.getByTestId('pro-showcase-open')
    await expect(openButton).toBeVisible()

    // Обращений к /api/pro/* не было.
    expect(await proMockGets(page), 'не должно быть запросов к /api/pro/* у не-Pro').toBe(0)

    // Тап открывает экран «Подписка».
    await openButton.click()
    await expect(page.getByTestId('profile-page-title')).toHaveText('подписка.')
  })

  test('Pro: прежняя карточка с запросом GET /api/pro/report', async ({ page }) => {
    // ?proStatus=pro переопределяет статус; VITE_PRO_MOCK=ready мокает API.
    await page.goto(`${BASE}/?demo=1&proStatus=pro&tab=trends`)

    // Настоящая карточка Pro видна (не витрина) и получила ответ мока.
    const proCard = page.getByTestId('progress-pro-card')
    await expect(proCard).toBeVisible({ timeout: 8000 })
    await expect(proCard).toHaveAttribute('data-state', 'not_generated')

    // Витрины нет.
    await expect(page.getByTestId('progress-pro-showcase')).toHaveCount(0)

    // Был запрос GET /api/pro/report (счётчик dev-мока Pro).
    expect(await proMockGets(page), 'должен быть запрос к /api/pro/report у Pro').toBeGreaterThan(
      0
    )
  })
})
