import { expect, test } from '@playwright/test'

test('Focus UI Lab сохраняет изолированный preview route', async ({ page }) => {
  await page.goto('/?ui_lab=focus-check')
  await expect(page.getByRole('heading', { name: /UI-EXP-003 · Ярусный каталог/ })).toBeVisible()

  const previewLink = page.getByTestId('focus-check-open-preview')
  await expect(previewLink).toHaveAttribute('href', '?ui_lab=practice-catalog')
  await previewLink.click()

  await expect(page.getByRole('heading', { name: /Практики: production и «Ярусный каталог»/ })).toBeVisible()
  expect(page.url()).not.toContain('tab=')
  expect(page.url()).not.toContain('production')
})
