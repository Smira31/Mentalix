import { expect, test } from '@playwright/test'

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

for (const viewport of VIEWPORTS) {
  test(`onboarding Preview flow ${viewport.name} сохраняет первый next step без side effects`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    const apiRequests = []
    page.on('request', request => {
      if (request.url().includes('/api/')) apiRequests.push(request.url())
    })

    await page.goto('/?ui_lab=experiments')

    const experiment = page.locator('.mx-onboarding-lab')
    await expect(experiment).toBeVisible()
    await expect(experiment).toContainText('Первый шаг без анкеты')
    await expect(page.locator('body')).toHaveCSS('overflow-x', 'hidden')

    const initialKeys = await page.evaluate(() => Object.keys(localStorage))

    await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
    await expect(experiment).toHaveAttribute('data-step', 'today')
    await expect(experiment.getByRole('button', { name: 'Начать чек-ин' })).toBeVisible()

    await experiment.getByRole('button', { name: 'Назад' }).click()
    await expect(experiment).toHaveAttribute('data-step', 'welcome')

    await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
    await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()
    await expect(experiment).toHaveAttribute('data-step', 'checkin')

    const nextStep = '15 минут спокойно разобрать первую задачу'
    await experiment.locator('textarea').fill(nextStep)
    await experiment.getByRole('button', { name: 'Показать в Today' }).click()

    await expect(experiment).toHaveAttribute('data-step', 'activated')
    await expect(experiment.locator('.mx-onboarding-lab__today h3')).toHaveText(nextStep)
    await expect(experiment).toContainText('Шаг сохранён в сегодняшнем дне')

    const finalKeys = await page.evaluate(() => Object.keys(localStorage))
    expect(finalKeys).toEqual(initialKeys)
    expect(apiRequests).toEqual([])

    await experiment.getByRole('button', { name: 'Сначала' }).click()
    await expect(experiment).toHaveAttribute('data-step', 'welcome')
    await expect(experiment.locator('textarea')).toHaveCount(0)
  })
}
