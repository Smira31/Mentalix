import { expect, test } from '@playwright/test'

const USER = { id: 900991, first_name: 'Тест' }
const PROGRESS_KEY = `mx-hero-journey-progress:${USER.id}`
const DEMO_DRAFT_KEY = 'mx-hero-journey-draft:900001:uncertainty'

for (const width of [393, 789]) {
  test(`Продолжить не обходит блокировку следующего дня (${width})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 852 })
    await page.addInitScript(
      ({ user, key }) => {
        localStorage.clear()
        localStorage.setItem('mentalix_web_user', JSON.stringify(user))
        localStorage.setItem('mx-onboarded-v2', '1')
        localStorage.setItem(
          key,
          JSON.stringify({
            completed: { uncertainty: new Date().toISOString() },
            signs: {},
            reflections: {},
            actions: {},
          })
        )
      },
      { user: USER, key: PROGRESS_KEY }
    )
    await page.route('**/api/**', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    )
    await page.goto('/?tab=library')
    await page.getByTestId('library-hero').click()
    await expect(page.getByTestId('hero-step-temporality')).toHaveAttribute('data-state', 'locked')
    await page.getByTestId('hero-continue').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()
    await expect(page.getByTestId('hero-step-start')).toHaveCount(0)
    await expect(page.getByTestId('hero-step-temporality')).toBeDisabled()
  })
}

test('черновик сохраняется с debounce и при выходе, восстанавливается, очищается после завершения', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/?demo=1&tab=library&action=hero_journey')
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await page.getByTestId('hero-write-input').fill('Черновик первого шага')
  await expect
    .poll(() =>
      page.evaluate(
        key => JSON.parse(localStorage.getItem(key) || '{}').reflection?.trim(),
        DEMO_DRAFT_KEY
      )
    )
    .toBe('Черновик первого шага')
  // Новая правка + немедленный уход до истечения debounce.
  await page.getByTestId('hero-write-input').fill('Последняя правка перед выходом')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  await page.getByTestId('library-hero').click()
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await expect(page.getByTestId('hero-write-input')).toHaveText('Последняя правка перед выходом')
  await page.getByTestId('hero-write-next').click()
  await expect(page.getByTestId('hero-action-input')).toBeVisible()
  await page.getByTestId('hero-action-input').fill('Одно действие')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-write-input')).toBeVisible()
  await page.getByTestId('hero-write-next').click()
  await expect(page.getByTestId('hero-action-input')).toHaveText('Одно действие')
  await page.getByTestId('hero-action-next').click()
  await expect(page.getByTestId('hero-complete-map')).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), DEMO_DRAFT_KEY)).toBeNull()
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('mx-hero-journey-progress:900001'))
  )
  expect(progress.reflections.uncertainty).toBe('Последняя правка перед выходом')
  expect(progress.actions.uncertainty).toBe('Одно действие')
  await page.getByTestId('hero-complete-map').click()
  await expect(page.getByTestId('hero-step-uncertainty')).toHaveAttribute('data-state', 'done')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.locator('.mx-library-course-progress')).toHaveText('Шаг 2 из 16')
})

test('Назад проходит по подэкранам шага: запись и действие', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem(
      'mx-hero-journey-progress:900001',
      JSON.stringify({
        completed: { uncertainty: '2026-10-01', temporality: '2026-10-02', choice: '2026-10-03' },
        signs: {},
        reflections: {},
        actions: {},
      })
    )
  })
  await page.goto('/?demo=1&tab=library&action=hero_journey')
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await expect(page.getByTestId('hero-write-input')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
})

test('Библиотека показывает реальное число завершённых шагов', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem(
      'mx-hero-journey-progress:900001',
      JSON.stringify({
        completed: { uncertainty: '2026-10-01', temporality: '2026-10-02', choice: '2026-10-03' },
        signs: {},
        reflections: {},
        actions: {},
      })
    )
  })
  await page.goto('/?demo=1&tab=library')
  await expect(page.locator('.mx-library-course-progress')).toHaveText('Шаг 4 из 16')
})
