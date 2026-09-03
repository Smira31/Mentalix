import { expect, test } from '@playwright/test'

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

const FIRST_STEP = '10 минут разобрать макет'

for (const viewport of VIEWPORTS) {
  test(`daily canonical flow ${viewport.name} доносит First Step без изменений через весь день`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    const apiRequests = []
    page.on('request', request => {
      if (request.url().includes('/api/')) apiRequests.push(request.url())
    })

    await page.goto('/?ui_lab=daily-canonical')

    const experiment = page.locator('.mx-daily')
    await expect(experiment).toBeVisible()
    await expect(experiment).toHaveAttribute('data-phase', 'welcome')
    await expect(page.locator('body')).toHaveCSS('overflow-x', 'hidden')

    const noHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
    expect(noHorizontalOverflow).toBe(true)

    // Welcome -> Today/checkinPending
    await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'checkinPending')

    // Today/checkinPending -> Morning Check-in
    await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'morningCheckin')

    for (const metric of ['Настроение', 'Энергия', 'Шум в голове', 'Фокус / собранность']) {
      await page.getByRole('radio', { name: `${metric}: 3 из 5` }).click()
    }
    await page.getByRole('button', { name: 'Дальше' }).click()

    await page.getByRole('radio', { name: 'Разобраться с важным' }).click()
    await page.getByRole('button', { name: 'Выбрать шаг' }).click()

    await page.getByRole('textbox', { name: 'Первый шаг' }).fill(FIRST_STEP)
    await page.getByRole('button', { name: 'Начать день' }).click()

    await expect(page.getByRole('definition').filter({ hasText: FIRST_STEP })).toBeVisible()
    await page.getByRole('button', { name: 'Подтвердить' }).click()

    // Morning Check-in -> Today/dayInProgress, First Step дословно
    await expect(experiment).toHaveAttribute('data-phase', 'dayInProgress')
    await expect(experiment.locator('[data-state="dayInProgress"]')).toContainText(FIRST_STEP)

    // dayInProgress -> completion
    await experiment.getByRole('button', { name: 'Отметить выполненным' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'completion')

    // completion -> Today/reviewPending, First Step всё ещё дословно
    await experiment.getByRole('button', { name: 'К вечернему разбору' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'reviewPending')
    await expect(experiment.locator('[data-state="reviewPending"]')).toContainText(FIRST_STEP)

    // reviewPending -> Evening Review
    await experiment.locator('.mx-daily__bridge').getByText('Разобрать день').click()
    await expect(experiment).toHaveAttribute('data-phase', 'eveningReview')

    await page.getByRole('button', { name: 'Разобрать день', exact: true }).click()
    await page.getByRole('radio', { name: 'Сделал главное' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('radio', { name: 'Ясность' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('radio', { name: 'Маленький шаг помогает' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('radio', { name: 'Начать с пяти минут' }).click()
    await page.getByRole('button', { name: 'Закрыть день' }).click()

    await expect(page.getByText('День закрыт')).toBeVisible()
    await page.getByRole('button', { name: 'Продолжить' }).click()

    // Evening Review -> Today/dayClosed, First Step всё ещё дословно
    await expect(experiment).toHaveAttribute('data-phase', 'dayClosed')
    await expect(experiment.locator('[data-state="dayClosed"]')).toContainText(FIRST_STEP)

    // Day Closed -> Next Day -> назад к Welcome
    await experiment.getByRole('button', { name: 'Следующий день' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'welcome')

    expect(apiRequests).toEqual([])
  })
}

test('daily canonical debug controls прыгают напрямую в каждое состояние без падений', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?ui_lab=daily-canonical')

  const experiment = page.locator('.mx-daily')

  for (const [label, phase] of [
    ['CHECKIN PENDING', 'checkinPending'],
    ['DAY IN PROGRESS', 'dayInProgress'],
    ['REVIEW PENDING', 'reviewPending'],
    ['DAY CLOSED', 'dayClosed'],
    ['NEW USER', 'welcome'],
  ]) {
    await experiment.getByRole('button', { name: label, exact: true }).click()
    await expect(experiment).toHaveAttribute('data-phase', phase)
  }

  await experiment.getByRole('button', { name: 'RESET' }).click()
  await expect(experiment).toHaveAttribute('data-phase', 'welcome')
})
