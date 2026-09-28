import { expect, test } from '@playwright/test'
import { backToToday, closeCompletion, emotionStep, openDayCard, scaleStep } from './checkin-helpers.mjs'

const card = (page, kind) => page.getByTestId(`today-card-${kind}`)

for (const viewport of [{ width: 390, height: 844 }, { width: 789, height: 1024 }]) {
  test(`демо: закрытый день переживает повтор утра (${viewport.width})`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/?demo=1&today_state=day_closed')
    await expect(card(page, 'morning')).toHaveAttribute('data-state', 'done')
    await expect(card(page, 'evening')).toHaveAttribute('data-state', 'done')
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('mentalix_preview_demo_state_v5:day_closed')))
    await openDayCard(page, 'morning')
    await page.getByTestId('history-redo-button').click()
    await page.getByTestId('history-redo-menu').getByText('Пройти утро заново').click()
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
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('mentalix_preview_demo_state_v5:day_closed')))
    const date = before.checkins.find(item => item.id === 900501).date
    expect(after.checkins.filter(item => item.date !== date)).toEqual(before.checkins.filter(item => item.date !== date))
    expect(after.checkins.find(item => item.date === date).review_completed_at).toBe(before.checkins.find(item => item.date === date).review_completed_at)
    expect(after.profile).toEqual(before.profile)
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
  await emotionStep(page, 'ровно')
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
