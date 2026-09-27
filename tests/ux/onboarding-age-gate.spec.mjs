import { expect, test } from '@playwright/test'

async function openAgeStep(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mentalix_web_user', JSON.stringify({ id: 900001, first_name: 'Тест' }))
    localStorage.removeItem('mx-onboarded-v2')
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.getByRole('button', { name: 'Меньше тревоги' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByRole('heading', { name: 'Сколько тебе лет?' })).toBeVisible()
}

test('до 18 лет нельзя продолжить знакомство, но можно вернуться', async ({ page }) => {
  await openAgeStep(page)
  await page.getByRole('button', { name: 'До 18' }).click()
  await expect(page.getByRole('alert')).toHaveText('Mentalix доступен с 18 лет')
  await expect(page.getByRole('button', { name: 'Дальше' })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Сколько тебе лет?' })).toBeVisible()
  await page.getByRole('button', { name: 'Назад' }).click()
  await expect(page.getByRole('heading', { name: 'Что сейчас важнее всего?' })).toBeVisible()
})

test('с 18 лет можно продолжить знакомство', async ({ page }) => {
  await openAgeStep(page)
  await page.getByRole('button', { name: '18–24' }).click()
  await expect(page.getByRole('button', { name: 'Дальше' })).toBeEnabled()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByRole('heading', { name: 'Когда напомнить о себе?' })).toBeVisible()
})
