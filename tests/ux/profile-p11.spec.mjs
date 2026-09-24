import { expect, test } from '@playwright/test'

import { VIEWPORTS, openTelegram, openWeb } from './profile-helpers.mjs'

// П.11 — контракт экрана профиля после #801:
//   (а) экраны профиля и подэкраны монохромны — выбранный акцент
//       («Лазурный») их не красит;
//   (б) крупный заголовок профиля — 16±2 px под нижним краем шапки
//       Telegram на 393 и 440;
//   (в) в «о тебе.» статистика «дней в системе · чек-инов» — одна.
//
// Живёт отдельным спеком, а не в profile-stoic.spec.mjs: там остался
// тест «кнопка профиля 56 px», который падает против текущего кода
// (--mx-header-control: 43px в src/index.css) — расхождение с
// DESIGN_SYSTEM.md §5.4 решается отдельно и не должно блокировать
// этот контракт.

// Акцент «Лазурный» (dark-тема) — #6FB7E0 = rgb(111, 183, 224).
// Экран «оформление.» не проверяем: образцы акцентов по дизайну
// рисуются своим hex.
const ACCENT_AZURE_RGB = 'rgb(111, 183, 224)'

async function expectNoAccentColor(page, testId) {
  const offenders = await page.evaluate(
    ({ testId, accentRgb }) => {
      const root = document.querySelector(`[data-testid="${testId}"]`)
      if (!root) return [`экран ${testId} не найден`]
      const bad = []
      for (const el of [root, ...root.querySelectorAll('*')]) {
        const cs = getComputedStyle(el)
        const tag = el.tagName.toLowerCase()
        if (cs.color === accentRgb) bad.push(`<${tag} class="${el.className}"> color`)
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
          if (cs[`border${side}Color`] === accentRgb) {
            bad.push(`<${tag} class="${el.className}"> border-${side.toLowerCase()}`)
          }
        }
      }
      return bad
    },
    { testId, accentRgb: ACCENT_AZURE_RGB }
  )
  expect(offenders, `${testId}: элементы, окрашенные акцентом «Лазурный»`).toEqual([])
}

for (const viewport of VIEWPORTS) {
  test.describe(`П.11 — контракт профиля — ${viewport.name} px`, () => {
    // (б): меряем от content-box .mx-app-shell — App.jsx владеет верхним
    // отступом, поэтому его content-top = нижний край шапки Telegram.
    test('заголовок профиля — 16±2 px под нижним краем шапки Telegram', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openTelegram(browser, baseURL, viewport)
      try {
        await page.getByTestId('today-profile-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()

        const headerBottom = await page.evaluate(() => {
          const shell = document.querySelector('.mx-app-shell')
          const rect = shell.getBoundingClientRect()
          return rect.top + parseFloat(getComputedStyle(shell).paddingTop)
        })
        const title = await page.getByTestId('profile-page-title').boundingBox()
        const gap = title.y - headerBottom
        expect(gap).toBeGreaterThanOrEqual(14)
        expect(gap).toBeLessThanOrEqual(18)
      } finally {
        await context.close()
      }
    })

    // (а): акцент ставится через addInitScript — init-скрипт openWeb
    // очищает localStorage при каждой загрузке.
    test('профиль и подэкраны монохромны при акценте «Лазурный»', async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openWeb(browser, baseURL, viewport)
      try {
        await context.addInitScript(() => localStorage.setItem('mx-accent-color', 'azure'))
        await page.reload()
        await expect(page.getByTestId('today-profile-button')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('data-accent', 'azure')

        await page.getByTestId('today-profile-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()
        await expectNoAccentColor(page, 'profile-screen')

        await page.getByTestId('profile-row-about').click()
        await expect(page.getByTestId('profile-sub-about')).toBeVisible()
        await expectNoAccentColor(page, 'profile-sub-about')
        await page.getByTestId('profile-close-button').click()
        await expect(page.getByTestId('profile-screen')).toBeVisible()

        await page.getByTestId('profile-row-prefs').click()
        await expect(page.getByTestId('profile-sub-prefs')).toBeVisible()
        await expectNoAccentColor(page, 'profile-sub-prefs')
      } finally {
        await context.close()
      }
    })
  })
}

// (в): строка статистики не дублируется — на 393 достаточно.
test('«о тебе.»: статистика «дней в системе · чек-инов» встречается один раз', async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openWeb(browser, baseURL, VIEWPORTS[0])
  try {
    await page.getByTestId('today-profile-button').click()
    await expect(page.getByTestId('profile-screen')).toBeVisible()
    await page.getByTestId('profile-row-about').click()
    await expect(page.getByRole('heading', { name: 'о тебе.' })).toBeVisible()

    await expect(page.getByTestId('profile-about-stats')).toHaveCount(1)
    await expect(page.getByTestId('profile-about-stats')).toContainText('дней в системе')
    await expect(page.getByTestId('profile-about-stats')).toContainText('чек-инов')
    await expect(page.getByText(/дней в системе/)).toHaveCount(1)
  } finally {
    await context.close()
  }
})
