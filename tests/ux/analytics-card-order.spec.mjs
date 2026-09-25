import { expect, test } from '@playwright/test'

async function openDemo(page) {
  await page.goto('/?demo=1&tab=trends')
  await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeVisible()
}

test('hide graph from its menu and restore it from order controls', async ({ page }) => {
  await openDemo(page)
  const card = page.getByTestId('progress-mood-trend')
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'Меню графика: Настроение' }).click()
  await card.getByRole('button', { name: 'Скрыть этот график' }).click()
  await expect(card).toHaveCount(0)
  await page.getByRole('button', { name: 'Порядок графиков' }).click()
  await page.getByRole('checkbox', { name: 'Показывать: Настроение' }).check()
  await expect(card).toBeVisible()
})

test('card order survives reload', async ({ page }) => {
  await openDemo(page)
  await page.getByRole('button', { name: 'Порядок графиков' }).click()
  await page.getByRole('button', { name: 'Выше: Настроение' }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeVisible()
  const ids = await page.locator('[data-testid^="progress-"]').filter({ has: page.locator('.mx-progress-card__head') }).evaluateAll(nodes => nodes.map(node => node.dataset.testid))
  expect(ids.indexOf('progress-mood-trend')).toBeLessThan(ids.indexOf('progress-mood-calendar'))
})

test('analytics renders without localStorage', async ({ page }) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem
    const set = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'mentalix_analytics_cards') throw new Error('Storage blocked')
      return get.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'mentalix_analytics_cards') throw new Error('Storage blocked')
      return set.call(this, key, value)
    }
  })
  await openDemo(page)
  await expect(page.getByTestId('progress-practices')).toBeVisible()
  await expect(page.getByTestId('progress-mood-trend')).toBeVisible()
})
