import { expect, test } from '@playwright/test'
import { openTelegram, openWeb } from './profile-helpers.mjs'

// PR #970 — wave 3: подписка без прокрутки, маленький заголовок.

const VIEWPORT_430 = { name: '430', width: 430, height: 932 }
const VIEWPORT_390 = { name: '390', width: 390, height: 844 }

for (const viewport of [VIEWPORT_430, VIEWPORT_390]) {
  test.describe(`Подписка без прокрутки — ${viewport.name}×${viewport.height}`, () => {
    test('весь экран помещается, кнопка в видимой области', async ({ browser, baseURL }) => {
      const { context, page } = await openWeb(browser, baseURL, viewport)
      try {
        await page.getByTestId('today-profile-button').click()
        await page.getByTestId('profile-screen').getByText('Подписка').click()
        await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()

        const scroll = page.locator('.mx-fullscreen-scroll')
        const scrollBox = await scroll.boundingBox()
        const scrollHeight = await scroll.evaluate(el => el.scrollHeight)
        // Экран помещается без вертикальной прокрутки.
        expect(Math.round(scrollHeight)).toBeLessThanOrEqual(Math.round(scrollBox.height) + 1)

        // Кнопка в видимой области.
        const button = page.getByTestId('subscription-pay-button')
        const btnBox = await button.boundingBox()
        expect(Math.round(btnBox.y + btnBox.height)).toBeLessThanOrEqual(
          Math.round(scrollBox.y + scrollBox.height)
        )
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

    // Вверху: большой заголовок виден, маленький — нет.
    const collapsedBar = page.getByTestId('profile-collapsed-bar')
    await expect(collapsedBar).not.toHaveClass(/--collapsed/)

    // Прокрутка вниз: большой уходит, маленький появляется.
    await page.locator('.mx-fullscreen-scroll').evaluate(el => {
      el.scrollTop = el.scrollHeight
    })
    await expect(collapsedBar).toHaveClass(/--collapsed/)

    // Возврат наверх: большой возвращается, маленький исчезает.
    await page.locator('.mx-fullscreen-scroll').evaluate(el => {
      el.scrollTop = 0
    })
    await expect(collapsedBar).not.toHaveClass(/--collapsed/)
  } finally {
    await context.close()
  }
})
