import { test, expect } from '@playwright/test'

/*
 * «Тема недели»: с «Сегодня» тап по карточке / «Записать» открывает сразу
 * экран записи следующего непройденного вопроса; в «Шагах» карусель остаётся.
 * Демо: 2 ответа из 7 → первый непройденный вопрос — 3-й, 4-й закрыт.
 */
test.describe('Тема недели: вход с «Сегодня» и карусель в «Шагах»', () => {
  test('Сегодня: карточка сразу открывает экран вопроса, назад — на «Сегодня»', async ({
    page,
  }) => {
    await page.goto('/?demo=1')

    const themeCard = page.getByTestId('today-theme-card')
    await expect(themeCard).toBeVisible({ timeout: 15_000 })
    await themeCard.click()

    // Сразу экран записи, без карусели
    const journal = page.getByTestId('journal-day-content')
    await expect(journal).toBeVisible({ timeout: 10_000 })
    await expect(journal).toContainText('День 3 из 7')
    await expect(page.getByTestId('theme-carousel-cta')).toHaveCount(0)

    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('today-theme-card')).toBeVisible({ timeout: 10_000 })
  })

  test('Шаги: тап по открытой карточке открывает вопрос этого дня', async ({ page }) => {
    await page.goto('/?demo=1&tab=practices')

    const carousel = page.locator('.mx-tqc-track')
    await expect(carousel).toBeVisible({ timeout: 15_000 })

    const active = carousel.locator('.mx-tqc-card[data-active="true"]')
    await expect(active).toBeVisible()
    await active.click()

    await expect(page.getByTestId('journal-day-content')).toBeVisible({ timeout: 10_000 })

    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('theme-carousel-cta')).toBeVisible({ timeout: 10_000 })
  })

  test('Кнопка под закрытой карточкой вмещает текст целиком', async ({ page }) => {
    await page.goto('/?demo=1&tab=practices')

    const carousel = page.locator('.mx-tqc-track')
    await expect(carousel).toBeVisible({ timeout: 15_000 })

    const closed = carousel.locator('.mx-tqc-card[data-open="false"]').first()
    await expect(closed).toHaveCount(1)
    const question = closed.locator('.mx-tqc-card__question')
    await expect(question).toBeVisible()
    await expect(question).toHaveCSS('opacity', '0.35')
    await expect(closed.locator('.mx-tqc-card__prompt')).toHaveCount(0)

    // Прокрутка к закрытой карточке — CTA отражает её состояние
    await closed.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    const cta = page.getByTestId('theme-carousel-cta')
    await expect(cta).toContainText('После вопроса')

    // Все состояния кнопки — без обрезки и переноса
    for (const width of [393, 440]) {
      await page.setViewportSize({ width, height: 852 })
      await expect
        .poll(async () => {
          const box = await cta.evaluate(el => ({
            scroll: el.scrollWidth,
            client: el.clientWidth,
            height: el.offsetHeight,
          }))
          return box.scroll <= box.client && box.height <= 42
        })
        .toBe(true)
    }
  })
})
