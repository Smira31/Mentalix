import { expect, test } from '@playwright/test'
import { VIEWPORTS, json, openWeb } from './profile-helpers.mjs'

// created_at — 76 дней назад, чтобы daysSinceRegistration вернул 77
// (функция добавляет +1 к разнице в днях).
const _regDate = new Date()
_regDate.setDate(_regDate.getDate() - 76)
const _created_at = `${_regDate.getFullYear()}-${String(_regDate.getMonth() + 1).padStart(2, '0')}-${String(_regDate.getDate()).padStart(2, '0')}`

const profileStats = {
  days_active: 77,
  total_checkins: 42,
  current_streak: 13,
  created_at: _created_at,
}

async function openAbout(browser, baseURL, response) {
  const { context, page } = await openWeb(browser, baseURL, VIEWPORTS[0])
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const date = day => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  const history = [yesterday, today].map(day => ({ date: date(day), status: 'completed' }))

  let releaseStreak
  await context.route('**/api/profile?*', route => route.fulfill(json(profileStats)))
  await context.route('**/api/checkin/history?*', route => route.fulfill(json(history)))
  await context.route('**/api/streak?*', async route => {
    if (response === 'pending') {
      await new Promise(resolve => { releaseStreak = resolve })
      return route.fulfill(json({ current_streak: 4, longest_streak: 8, total_active_days: 99 }))
    }
    return response === 'error' ? route.fulfill(json({ detail: 'unavailable' }, 404)) : route.fulfill(json(response))
  })
  await page.getByTestId('today-profile-button').click()
  await page.getByTestId('profile-row-about').click()
  await expect(page.getByRole('heading', { name: 'о тебе.' })).toBeVisible()
  return { context, page, releaseStreak: () => releaseStreak?.() }
}

test('Profile: серия скрыта, пока мягкая серия грузится; сервер — единственный источник', async ({ browser, baseURL }) => {
  const { context, page, releaseStreak } = await openAbout(browser, baseURL, 'pending')
  try {
    const about = page.getByTestId('profile-sub-about')
    // Пока /api/streak не ответил, серийных строк нет вовсе —
    // локального расчёта по истории чек-инов больше не существует.
    await expect(about.getByText('Дней в системе', { exact: true })).toBeVisible()
    await expect(about.locator('.mx-profile-row', { hasText: 'Текущая серия' })).toHaveCount(0)
    await expect(about.locator('.mx-profile-row', { hasText: 'Лучшая серия' })).toHaveCount(0)
    releaseStreak()
    await expect(about.locator('.mx-profile-row', { hasText: 'Текущая серия' })).toContainText('4 дней')
    await expect(about.locator('.mx-profile-row', { hasText: 'Лучшая серия' })).toContainText('8 дней')
  } finally {
    releaseStreak()
    await context.close()
  }
})

for (const { name, response, current, best, next } of [
  { name: 'canonical primary', response: { current_streak: 4, longest_streak: 8, total_active_days: 99 }, current: 4, best: 8, next: 'Ещё 3 дня до «Неделя ровно»' },
  { name: 'canonical zero', response: { current_streak: 0, longest_streak: 0, total_active_days: 0 }, current: 0, best: 0, next: 'Ещё 3 дня до «Держится»' },
  { name: 'network error', response: 'error', current: null, best: null, next: 'Ещё 2 дня до значка «Второй день»' },
  { name: 'invalid payload', response: { current_streak: '4', longest_streak: 8, total_active_days: 99 }, current: null, best: null, next: 'Ещё 2 дня до значка «Второй день»' },
]) {
  test(`Profile: ${name}, non-streak stats and nearest`, async ({ browser, baseURL }) => {
    const { context, page } = await openAbout(browser, baseURL, response)
    try {
      const about = page.getByTestId('profile-sub-about')
      if (current == null) {
        // Нет корректных серверных данных — серийные строки скрыты целиком,
        // история чек-инов серию не подменяет.
        await expect(about.getByText('Дней в системе', { exact: true })).toBeVisible()
        await expect(about.locator('.mx-profile-row', { hasText: 'Текущая серия' })).toHaveCount(0)
        await expect(about.locator('.mx-profile-row', { hasText: 'Лучшая серия' })).toHaveCount(0)
      } else {
        await expect(about.locator('.mx-profile-row', { hasText: 'Текущая серия' })).toContainText(`${current} ${current === 1 ? 'день' : 'дней'}`)
        await expect(about.locator('.mx-profile-row', { hasText: 'Лучшая серия' })).toContainText(`${best} ${best === 1 ? 'день' : 'дней'}`)
      }
      await expect(about.getByText('Дней в системе', { exact: true }).locator('../..')).toContainText('77')
      await expect(about.locator('.mx-profile-row', { hasText: 'Всего чек-инов' })).toContainText('42')
      await expect(page.getByTestId('profile-about-stats')).toContainText('77 дней в системе · 42 чек-инов')
      await expect(about.getByRole('progressbar', { name: next })).toBeVisible()
    } finally {
      await context.close()
    }
  })
}
