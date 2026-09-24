import { expect, test } from '@playwright/test'

import { VIEWPORTS, centerY, openTelegram, openWeb } from './profile-helpers.mjs'

// #618 — профиль и настройки по эталону Stoic (DESIGN_SYSTEM.md §5.4).
// Проверяем на 393 и 440 px: кнопка профиля, экран профиля, строки, карточки,
// отсутствие своих ✕/назад в Telegram.

for (const viewport of VIEWPORTS) {
  test.describe(`Профиль Stoic — ${viewport.name} px`, () => {
    test('кнопка профиля 43 px, 21 px справа от края фрейма, центр на линии огонька', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openWeb(browser, baseURL, viewport)
      try {
        const button = await page.getByTestId('today-profile-button').boundingBox()
        const chip = await page.getByTestId('today-streak-chip').boundingBox()
        // Отступ считаем от края фрейма приложения (mx-screen-shell), а не viewport:
        // фрейм центрируется, и на широком экране его край не совпадает с краем окна.
        const shell = await page
          .getByTestId('today-profile-button')
          .locator('xpath=ancestor::div[contains(@class, "mx-screen-shell")][1]')
          .boundingBox()
        expect(Math.round(button.width)).toBe(43)
        expect(Math.round(button.height)).toBe(43)
        expect(Math.abs(shell.x + shell.width - (button.x + button.width) - 21)).toBeLessThanOrEqual(1)
        expect(Math.abs(centerY(button) - centerY(chip))).toBeLessThanOrEqual(2)
      } finally {
        await context.close()
      }
    })

    test('экран профиля открывается и закрывается; строки 50 px, поля карточек 16 px', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openWeb(browser, baseURL, viewport)
      try {
        await page.getByTestId('today-profile-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        await expect(page.getByRole('heading', { name: 'твой профиль.' })).toBeVisible()

        const row = await page.getByTestId('profile-row-checkins').boundingBox()
        expect(Math.round(row.height)).toBe(50)
        const card = await page.getByTestId('profile-card-setup').boundingBox()
        expect(Math.round(card.x)).toBe(16)
        expect(Math.round(viewport.width - (card.x + card.width))).toBe(16)

        // Под-экран и возврат.
        await page.getByTestId('profile-row-prefs').click()
        await expect(page.getByRole('heading', { name: 'настройки.' })).toBeVisible()
        const back = await page.getByTestId('profile-close-button')
        const backBox = await back.boundingBox()
        expect(Math.round(backBox.width)).toBe(44)
        expect(Math.round(backBox.x)).toBe(20)
        await back.click()
        await expect(page.getByRole('heading', { name: 'твой профиль.' })).toBeVisible()

        // Закрытие профиля — круглая кнопка web.
        await page.getByTestId('profile-close-button').click()
        await expect(page.getByTestId('profile-screen')).toHaveCount(0)
        await expect(page.getByTestId('today-profile-button')).toBeVisible()
      } finally {
        await context.close()
      }
    })

    test('в Telegram своих ✕/назад нет — работает нативная «Назад»', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openTelegram(browser, baseURL, viewport)
      try {
        await page.getByTestId('today-profile-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        await expect(page.getByTestId('profile-close-button')).toHaveCount(0)

        await page.getByTestId('profile-row-about').click()
        await expect(page.getByRole('heading', { name: 'о тебе.' })).toBeVisible()
        await expect(page.getByTestId('profile-close-button')).toHaveCount(0)

        await page.evaluate(() => window.__telegramBackClick())
        await expect(page.getByRole('heading', { name: 'твой профиль.' })).toBeVisible()
        await page.evaluate(() => window.__telegramBackClick())
        await expect(page.getByTestId('profile-screen')).toHaveCount(0)
        await expect(page.getByTestId('today-profile-button')).toBeVisible()
      } finally {
        await context.close()
      }
    })
  })
}
