import { expect, test } from '@playwright/test'

/**
 * Регрессия: нажатие «Читать» в Библиотеке открывает каталог статей,
 * а не зависает на экране (screen_stuck).
 *
 * Воспроизводится в demo-режиме (?demo=1), без API-фикстур.
 */
test.describe('Library — «Читать» открывает каталог', () => {
  test('нажатие «Читать» открывает каталог статей без зависания', async ({ page }) => {
    await page.goto('/?demo=1&tab=library')

    // Корень библиотеки загрузился
    await expect(page.getByText('библиотека.')).toBeVisible({ timeout: 15_000 })

    // Кнопка «Читать» видна и кликабельна
    const readButton = page.getByRole('button', { name: 'Читать' })
    await expect(readButton).toBeVisible()
    await readButton.click()

    // Каталог статей открылся — заголовок «статьи.» виден
    await expect(page.getByText('статьи.')).toBeVisible({ timeout: 5_000 })

    // В каталоге есть карточки статей
    const articleCards = page.locator('.mx-library-v2__catalog-card')
    await expect(articleCards.first()).toBeVisible({ timeout: 5_000 })
    expect(await articleCards.count()).toBeGreaterThan(0)
  })
})
