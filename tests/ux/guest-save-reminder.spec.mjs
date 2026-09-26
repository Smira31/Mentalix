import { expect, test } from '@playwright/test'

for (const width of [393, 789]) {
  test(`гостевое напоминание: переход и скрытие (${width})`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 852 }, serviceWorkers: 'block' })
    const page = await context.newPage()
    await page.goto('/?demo=1&guest=1')
    const reminder = page.getByTestId('guest-save-reminder')
    await expect(reminder).toBeVisible()
    await expect(reminder.getByText('Твои записи хранятся только в этом браузере')).toBeVisible()
    await page.getByTestId('guest-save-reminder-action').click()
    await expect(page.getByTestId('profile-guest-login-link')).toBeVisible()
    await page.getByTestId('profile-guest-login-link').click()
    await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()

    await page.goto('/?demo=1&guest=1')
    await expect(reminder).toBeVisible()
    await page.getByTestId('guest-save-reminder-close').click()
    await expect(reminder).toHaveCount(0)
    await page.reload()
    await expect(page.getByTestId('today-profile-button')).toBeVisible()
    await expect(reminder).toHaveCount(0)
    await context.close()
  })
}

test('обычный демо-аккаунт не видит гостевое напоминание', async ({ page }) => {
  await page.goto('/?demo=1')
  await expect(page.getByTestId('today-profile-button')).toBeVisible()
  await expect(page.getByTestId('guest-save-reminder')).toHaveCount(0)
})
