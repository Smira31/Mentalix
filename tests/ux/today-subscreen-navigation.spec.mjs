import { expect, test } from '@playwright/test'

/**
 * Регрессия «чёрного экрана» в Telegram WebView: переходы из «Сегодня»
 * в под-экраны (мысль дня, тема недели) открывают экран, а не оставляют
 * пустой shell; системное «Назад» возвращает к карточкам.
 *
 * Воспроизводится в demo-режиме (?demo=1), без API-фикстур.
 */
test.describe('Сегодня — переходы в под-экраны', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    })
  })

  test('Мысль дня открывается и возвращается назад', async ({ page }) => {
    await page.goto('/?demo=1')

    const quoteCard = page.getByTestId('today-quote-card')
    await expect(quoteCard).toBeVisible({ timeout: 15_000 })
    await quoteCard.click()

    await expect(page.getByRole('button', { name: 'Поделиться' })).toBeVisible({
      timeout: 10_000,
    })

    await page.getByTestId('back-button').click()
    await expect(quoteCard).toBeVisible({ timeout: 10_000 })
  })

  test('Тема недели открывается и возвращается назад', async ({ page }) => {
    await page.goto('/?demo=1')

    const themeCard = page.getByTestId('today-theme-card')
    await expect(themeCard).toBeVisible({ timeout: 15_000 })
    await themeCard.click()

    await expect(page.getByTestId('theme-carousel-cta')).toBeVisible({ timeout: 10_000 })

    await page.getByTestId('back-button').click()
    await expect(themeCard).toBeVisible({ timeout: 10_000 })
  })
})
