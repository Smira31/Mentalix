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
 * в демо-режиме (?demo=1) /api/subscription возвращает пустой массив
 * (has_pro=false), а ?proStatus=pro переопределяет статус для проверки
 * карточки Pro. Dev-only mock ?proMock (VITE_PRO_MOCK=ready) отвечает на
 * /api/pro/report.
 *
 * Запуск в web-контейнере:
 *   npx playwright test --config=playwright.pro-showcase.config.mjs
 */

const BASE = 'http://127.0.0.1:4181'

test.describe('Витрина Pro в аналитике', () => {
  test('гость: карточка видна, запросов к /api/pro/* нет, тап открывает подписку', async ({
    page,
  }) => {
    const proRequests = []
    page.on('request', req => {
      if (req.url().includes('/api/pro/') || req.url().includes('/pro/report')) {
        proRequests.push(req.url())
      }
    })

    await page.goto(`${BASE}/?demo=1&guest=1&tab=trends`)

    // Карточка витрины видна.
    const showcase = page.getByTestId('progress-pro-showcase')
    await expect(showcase).toBeVisible()

    // Заголовок и бейдж «Pro».
    await expect(page.getByText('Разбор и план недели').first()).toBeVisible()
    await expect(showcase.locator('.mx-pro-showcase-card__badge')).toHaveText('Pro')

    // Кнопка «Открыть Pro» видна (PAYMENT_UI_ENABLED=true в конфиге).
    const openButton = page.getByTestId('pro-showcase-open')
    await expect(openButton).toBeVisible()

    // Запросов к /api/pro/* не было.
    await page.waitForTimeout(1000)
    expect(proRequests, 'не должно быть запросов к /api/pro/* у гостя').toHaveLength(0)

    // Тап открывает экран «Подписка».
    await openButton.click()
    await expect(page.getByText('подписка.')).toBeVisible({ timeout: 5000 })
  })

  test('не-Pro: карточка видна, запросов к /api/pro/* нет, тап открывает подписку', async ({
    page,
  }) => {
    const proRequests = []
    page.on('request', req => {
      if (req.url().includes('/api/pro/') || req.url().includes('/pro/report')) {
        proRequests.push(req.url())
      }
    })

    await page.goto(`${BASE}/?demo=1&tab=trends`)

    // Карточка витрины видна (не-Pro пользователь в демо).
    const showcase = page.getByTestId('progress-pro-showcase')
    await expect(showcase).toBeVisible()

    // Кнопка «Открыть Pro» видна.
    const openButton = page.getByTestId('pro-showcase-open')
    await expect(openButton).toBeVisible()

    // Запросов к /api/pro/* не было.
    await page.waitForTimeout(1000)
    expect(proRequests, 'не должно быть запросов к /api/pro/* у не-Pro').toHaveLength(0)

    // Тап открывает экран «Подписка».
    await openButton.click()
    await expect(page.getByText('подписка.')).toBeVisible({ timeout: 5000 })
  })

  test('Pro: прежняя карточка с запросом GET /api/pro/report', async ({ page }) => {
    const proRequests = []
    page.on('request', req => {
      if (req.url().includes('/pro/report')) {
        proRequests.push(req.url())
      }
    })

    // ?proStatus=pro переопределяет статус; VITE_PRO_MOCK=ready мокает API.
    await page.goto(`${BASE}/?demo=1&proStatus=pro&tab=trends`)

    // Настоящая карточка Pro видна (не витрина).
    const proCard = page.getByTestId('progress-pro-card')
    await expect(proCard).toBeVisible({ timeout: 8000 })

    // Витрины нет.
    await expect(page.getByTestId('progress-pro-showcase')).not.toBeVisible()

    // Был запрос к /api/pro/report.
    await page.waitForTimeout(2000)
    expect(proRequests.length, 'должен быть запрос к /api/pro/report у Pro').toBeGreaterThan(0)
  })
})
