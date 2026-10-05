import { expect, test } from '@playwright/test'

async function expectClickable(control) {
  await expect(control).toBeVisible()
  expect(
    await control.evaluate(button => {
      const box = button.getBoundingClientRect()
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return button === hit || button.contains(hit)
    })
  ).toBe(true)
}

for (const device of ['standard', 'max']) {
  test(`демо ${device}: аналитика и значки в строке Telegram`, async ({ page }) => {
    await page.setViewportSize({ width: 793, height: 1196 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`/?demo=1&device=${device}`)
    const frame = page.locator("[data-mentalix-demo-frame='true'][data-demo-mode='true']")
    await expect(frame).toBeVisible()
    await expect(page.locator('.mx-demo-telegram-chrome__island')).toHaveCount(0)
    await expect(page.locator('.mx-demo-telegram-chrome__home-indicator')).toHaveCount(0)

    await page.getByRole('button', { name: 'Прогресс', exact: true }).click()
    const analytics = page.getByTestId('progress-tab-analytics')
    const history = page.getByTestId('progress-tab-history')
    await expectClickable(analytics)
    await expectClickable(history)
    expect(
      await analytics.evaluate(button =>
        button
          .closest('[data-testid="demo-telegram-header"]')
          ?.parentElement?.getAttribute('data-demo-mode')
      )
    ).toBe('true')
    await history.click()
    await expect(history).toHaveAttribute('aria-selected', 'true')
    await analytics.click()
    await expect(analytics).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.mx-progress-analytics__title')).toBeVisible()
    await page.screenshot({ path: `/tmp/mentalix-telegram-${device}-analytics.png` })

    await page.getByRole('button', { name: 'Сегодня', exact: true }).click()
    await expect(page.getByTestId('demo-telegram-header')).toHaveCount(0)
    await page.getByTestId('today-streak-chip').click()
    const badges = page.getByTestId('series-tab-badges')
    const stats = page.getByTestId('series-tab-stats')
    await expectClickable(badges)
    await expectClickable(stats)
    await expect(page.getByTestId('series-close')).toHaveCount(0)
    await expect(page.locator('.mx-path-featured-award')).toBeVisible()
    const tabsBox = await page.locator('.mx-path-tabs').boundingBox()
    const controlsBox = await page.locator('.mx-demo-telegram-chrome__controls').boundingBox()
    expect(Math.abs(tabsBox.y - controlsBox.y)).toBeLessThanOrEqual(2)
    await page.screenshot({ path: `/tmp/mentalix-telegram-${device}-badges.png` })
    await stats.click()
    await expect(stats).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('stats-tiles')).toBeVisible()
    await page.screenshot({ path: `/tmp/mentalix-telegram-${device}-stats.png` })
    await badges.click()
    await expect(badges).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.mx-path-featured-award')).toBeVisible()
    await page.getByTestId('demo-chrome-back').click()
    await expect(page.getByTestId('demo-telegram-header')).toHaveCount(0)
    await expect(page.getByTestId('today-streak-chip')).toBeVisible()
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('мобильное демо без рамки сохраняет обычную шапку', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto('/?demo=1')
  await page.getByRole('button', { name: 'Прогресс', exact: true }).click()
  await expect(page.getByTestId('demo-telegram-header')).toHaveCount(0)
  await expectClickable(page.getByTestId('progress-tab-analytics'))
  await page.getByTestId('progress-tab-history').click()
  await expect(page.getByTestId('progress-tab-history')).toHaveAttribute('aria-selected', 'true')
  await context.close()
})
