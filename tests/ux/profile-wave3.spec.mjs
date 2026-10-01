import { expect, test } from '@playwright/test'
import { openTelegram, openWeb } from './profile-helpers.mjs'

// PR #970 — wave 3: подписка без прокрутки, маленький заголовок.
//
// Стабильность: после программного скролла диспетчеризируем scroll event
// вручную (headless Chrome может не fired его автоматически), а проверки
// делаем через expect.poll — без фиксированных таймаутов.

const VIEWPORT_430 = { name: '430', width: 430, height: 932 }
const VIEWPORT_390 = { name: '390', width: 390, height: 844 }

/** Программный скролл + ручная диспетчеризация scroll event. */
async function scrollTo(page, scrollTop) {
  await page.locator('.mx-fullscreen-scroll').evaluate((el, top) => {
    el.scrollTop = top
    el.dispatchEvent(new Event('scroll', { bubbles: false }))
  }, scrollTop)
}

for (const viewport of [VIEWPORT_430, VIEWPORT_390]) {
  test.describe(`Подписка без прокрутки — ${viewport.name}×${viewport.height}`, () => {
    test('весь экран помещается, кнопка в видимой области', async ({ browser, baseURL }) => {
      const { context, page } = await openWeb(browser, baseURL, viewport)
      try {
        await page.getByTestId('today-profile-button').click()
        await page.getByTestId('profile-screen').getByText('Подписка').click()
        await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()

        // Ждём, пока контент стабилизируется (SVG-иллюстрация и шрифты),
        // затем проверяем — без прокрутки.
        await expect.poll(
          async () => {
            const scroll = page.locator('.mx-fullscreen-scroll')
            const box = await scroll.boundingBox()
            const height = await scroll.evaluate(el => el.scrollHeight)
            if (!box) return Infinity
            return Math.round(height) - Math.round(box.height)
          },
          { timeout: 10_000, intervals: [500, 1000, 2000] }
        ).toBeLessThanOrEqual(1)

        // Кнопка в footer — вне скролл-контейнера, проверяем по viewport.
        const button = page.getByTestId('subscription-pay-button')
        const btnBox = await button.boundingBox()
        expect(Math.round(btnBox.y + btnBox.height)).toBeLessThanOrEqual(viewport.height)
      } finally {
        await context.close()
      }
    })
  })
}

test('маленький заголовок не виден, пока большой в зоне видимости', async ({ browser, baseURL }) => {
  const viewport = VIEWPORT_390
  const { context, page } = await openTelegram(browser, baseURL, viewport)
  try {
    await page.getByTestId('today-profile-button').click()
    await expect(page.getByTestId('profile-screen')).toBeVisible()

    const collapsedBar = page.getByTestId('profile-collapsed-bar')

    // Вверху: большой заголовок виден, маленький — нет.
    await expect(collapsedBar).not.toHaveClass(/--collapsed/)

    // Прокрутка вниз: большой уходит, маленький появляется.
    await scrollTo(page, 10_000)
    await expect(collapsedBar).toHaveClass(/--collapsed/, { timeout: 10_000 })

    // Возврат наверх: большой возвращается, маленький исчезает.
    await scrollTo(page, 0)
    await expect(collapsedBar).not.toHaveClass(/--collapsed/, { timeout: 10_000 })
  } finally {
    await context.close()
  }
})
