import { expect, test } from '@playwright/test'

test('демо-панель на телефоне: вечер и пустой аккаунт', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 440, height: 956 }, isMobile: true, hasTouch: true,
    colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block',
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/?demo=1&panel=1')
  await expect(page.getByTestId('demo-panel')).toBeVisible()
  await page.getByRole('button', { name: '19:30' }).click()
  await expect(page.getByTestId('demo-panel')).toBeVisible()
  await expect(page.getByTestId('today-card-evening')).toHaveAttribute('data-primary', 'true')
  await page.getByRole('button', { name: 'Новый пользователь' }).click()
  await expect(page.getByTestId('today-cards-hint')).toBeVisible()
  await expect(page.getByTestId('today-streak-chip')).toHaveAttribute('aria-label', /Серия ещё не началась/)
  await page.getByRole('button', { name: 'Закрыть демо-панель' }).click()
  await expect(page.getByTestId('demo-panel')).toHaveCount(0)
  await page.getByTestId('demo-panel-badge').click()
  await expect(page.getByTestId('demo-panel')).toBeVisible()
  await context.close()
})

test('без demo панель не загружается даже с panel=1', async ({ page }) => {
  await page.goto('/?panel=1')
  await expect(page.getByTestId('demo-panel')).toHaveCount(0)
  await expect(page.getByTestId('demo-panel-badge')).toHaveCount(0)
  const panelRequests = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('DemoPanel')))
  expect(panelRequests).toHaveLength(0)
})
