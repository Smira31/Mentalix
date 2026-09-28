import { expect, test } from '@playwright/test'
import { backToToday, closeCompletion, openDayCard, scaleStep } from './checkin-helpers.mjs'

const card = (page, kind) => page.getByTestId(`today-card-${kind}`)
const DEMO_KEY = 'mentalix_preview_demo_state_v5:day_closed'

for (const viewport of [{ width: 390, height: 844 }, { width: 789, height: 1024 }]) {
  test(`демо: закрытый день переживает повтор утра (${viewport.width})`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/?demo=1&today_state=day_closed')
    await expect(card(page, 'morning')).toHaveAttribute('data-state', 'done')
    await expect(card(page, 'evening')).toHaveAttribute('data-state', 'done')

    // Ключевой инвариант: после redo утренней части вечерний разбор
    // (review_completed_at) не должен сброситься в null.
    await openDayCard(page, 'morning')
    await page.getByTestId('history-redo-button').click()
    await page.getByTestId('history-redo-menu').getByText('Пройти утро заново').click()
    // Подтверждение в диалоге «Пройти заново?»
    await page.getByRole('dialog').getByRole('button', { name: 'Пройти заново' }).click()
    for (const level of [4, 3, 2, 3]) await scaleStep(page, level)
    await page.getByTestId('checkin-next').click()
    await page.getByTestId('checkin-complete').click()
    await expect(page.getByTestId('checkin-feedback-option').first()).toBeVisible()
    await expect(page.getByTestId('checkin-streak')).toBeVisible()
    await expect(page.getByTestId('checkin-back-to-today')).toBeVisible()
    await expect(page.getByTestId('streak-recovery-surface')).toHaveCount(0)
    await backToToday(page)
    await expect(card(page, 'morning')).toHaveAttribute('data-state', 'done')
    await expect(card(page, 'evening')).toHaveAttribute('data-state', 'done')

    // После redo состояние записано в localStorage (PUT триггерит writeState).
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('mentalix_preview_demo_state_v5:day_closed')))
    expect(after).toBeTruthy()

    // Вечерний разбор не сброшен — review_completed_at на месте.
    const todayAfter = after.checkins.find(item => item.id === 900501)
    expect(todayAfter).toBeTruthy()
    expect(todayAfter.review_completed_at).toBeTruthy()

    // Утренние поля обновлены (новые значения из redo), а не остались старыми.
    expect(todayAfter.mood).toBe(4)

    // Профиль не обнулён.
    expect(after.profile.current_streak).toBeGreaterThan(0)

    await context.close()
  })
}

test('демо: вечер открыт днём и проходится до завершения', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/?demo=1&review_open=1&today_state=morning_done')
  await expect(card(page, 'morning')).toHaveAttribute('data-state', 'done')
  await expect(card(page, 'evening')).toHaveAttribute('data-state', 'active')
  await openDayCard(page, 'evening')
  // Эмоция «ровно» уже предзаполнена из утреннего чек-ина — просто идём далее
  await page.getByTestId('checkin-next').click()
  for (let index = 0; index < 4; index += 1) {
    const next = page.getByTestId('checkin-next')
    if (await next.count()) await next.click()
    else break
  }
  await expect(page.getByTestId('checkin-feedback-option').first()).toBeVisible()
  await closeCompletion(page)
  await expect(card(page, 'evening')).toHaveAttribute('data-state', 'done')
  await context.close()
})

test('демо: review_open открывает вечер без утренней записи', async ({ page }) => {
  await page.goto('/?demo=1&review_open=1')
  await expect(card(page, 'evening')).toHaveAttribute('data-state', 'active')
})
