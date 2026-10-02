import { test, expect } from '@playwright/test'

/*
 * «Тема недели» с «Сегодня» — тот же экран-карусель, что «Шаги» → «Тема недели».
 * Демо: 2 ответа из 7 → первый непройденный вопрос — 3-й, 4-й закрыт.
 */
test.describe('Тема недели: карусель с «Сегодня»', () => {
  test('карточка на «Сегодня» открывает карусель, тап по карточке — запись', async ({ page }) => {
    await page.goto('/?demo=1')

    const themeCard = page.getByTestId('today-theme-card')
    await expect(themeCard).toBeVisible({ timeout: 15_000 })
    await themeCard.click()

    await expect(page.getByTestId('theme-carousel-cta')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('theme-carousel-cta')).toHaveText('Начать запись')

    // Старый экран не показывается
    await expect(page.getByText('Мои ответы', { exact: true })).toHaveCount(0)
    await expect(page.getByText('под замком')).toHaveCount(0)
    await expect(page.getByText('часть Библиотеки')).toHaveCount(0)

    // Тап по самой карточке (первый непройденный вопрос) открывает запись
    await page.locator('.mx-tqc-card[data-active="true"]').click()
    await expect(page.getByTestId('journal-day-content')).toContainText('День 3 из 7')

    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('theme-carousel-cta')).toBeVisible({ timeout: 10_000 })
  })

  test('закрытая карточка показывает текст и не открывается', async ({ page }) => {
    await page.goto('/?demo=1')
    await page.getByTestId('today-theme-card').click()
    await expect(page.getByTestId('theme-carousel-cta')).toBeVisible({ timeout: 10_000 })

    const closed = page.locator('.mx-tqc-card[data-open="false"]').first()
    await expect(closed).toHaveCount(1)
    const question = closed.locator('.mx-tqc-card__question')
    await expect(question).toBeVisible()
    await expect(question).not.toHaveText('')
    await expect(question).toHaveCSS('opacity', '0.35')
    await expect(closed.locator('.mx-tqc-card__prompt')).toHaveCount(0)

    await closed.click()
    await expect(page.getByTestId('journal-day-content')).toHaveCount(0)
    await expect(page.getByTestId('theme-carousel-cta')).toBeVisible()
  })
})
