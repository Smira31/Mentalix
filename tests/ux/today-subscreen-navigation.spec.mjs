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

    await expect(page.getByTestId('daily-thought-write')).toBeVisible({
      timeout: 10_000,
    })

    await page.getByTestId('daily-thought-back').click()
    await expect(quoteCard).toBeVisible({ timeout: 10_000 })
  })

  test('Тема недели открывается и возвращается назад', async ({ page }) => {
    await page.goto('/?demo=1')

    // «Все темы ›» открывает карусель темы недели
    const allThemes = page.getByTestId('today-theme-all')
    await expect(allThemes).toBeVisible({ timeout: 15_000 })
    await allThemes.click()

    await expect(page.getByTestId('theme-carousel-cta')).toBeVisible({ timeout: 10_000 })

    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('today-theme-card')).toBeVisible({ timeout: 10_000 })
  })
})
