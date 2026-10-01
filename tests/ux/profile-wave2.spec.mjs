import { expect, test } from '@playwright/test'
import { openTelegram, openWeb } from './profile-helpers.mjs'

const viewport = { name: '393', width: 393, height: 852 }

test('профиль: строки опроса, мультивыбор и сохранение на 393', async ({ browser, baseURL }) => {
  const { context, page } = await openWeb(browser, baseURL, viewport)
  try {
    await page.getByTestId('today-profile-button').click()
    await page.getByRole('button', { name: /Что было бы полезно\?/ }).click()
    await expect(page.getByRole('heading', { name: 'что было бы полезно?' })).toBeVisible()
    const back = page.getByTestId('profile-close-button')
    const box = await back.boundingBox()
    expect(Math.round(box.width)).toBe(43)
    expect(Math.round(box.height)).toBe(43)
    await expect(back).toHaveCSS('background-color', 'rgba(38, 38, 38, 0.55)')
    await expect(back).toHaveCSS('backdrop-filter', /blur\(20px\) saturate\(1\.6\)/)
    await expect(page.getByTestId('profile-page-title')).toHaveCSS('font-size', '34px')
    const rows = page.locator('.mx-wtp-option')
    await expect(rows).toHaveCount(3)
    const first = await rows.first().boundingBox()
    const second = await rows.nth(1).boundingBox()
    expect(Math.round(first.height)).toBe(52)
    expect(Math.round(second.y - first.y - first.height)).toBe(2)
    await expect(page.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    await rows.first().click()
    await rows.nth(1).click()
    await expect(rows.first()).toHaveAttribute('aria-pressed', 'true')
    await expect(rows.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Сохранить' })).toBeEnabled()
    await page.getByRole('button', { name: 'Сохранить' }).click()
    await expect(page.getByText(/Ты выбрал:/)).toContainText('Провести один сложный вопрос до действия')
    await expect(page.getByText(/Ты выбрал:/)).toContainText('Увидеть свои повторяющиеся паттерны')
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mx-wtp-concept-test-v1:900618')))
    expect(saved.concept).toEqual(['track', 'patterns'])
    await back.click()
    await expect(page.getByTestId('profile-screen')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('профиль: цель письма, липкая шапка и системная кнопка на 393', async ({ browser, baseURL }) => {
  const { context, page } = await openTelegram(browser, baseURL, viewport)
  try {
    await page.getByTestId('today-profile-button').click()
    await page.getByTestId('profile-row-checkins').click()
    await expect(page.getByTestId('profile-close-button')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'чек-ины.' })).toBeVisible()
    const goal = page.getByTestId('profile-row-writing-goal')
    await expect(goal).toContainText('Влияет только на подсказки. Серия не рвётся.')
    await expect(goal.locator('.mx-profile-row__value')).toHaveCSS('color', 'rgb(133, 133, 133)')
    expect(await goal.locator('.mx-profile-row__value').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(goal.locator('.mx-profile-row__chevron')).toHaveCount(1)
    await goal.click()
    await expect(goal).toContainText('3')
    await expect(page.getByRole('group', { name: 'Записей в неделю' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.setViewportSize({ width: 393, height: 320 })
    const screen = page.getByTestId('profile-sub-checkins')
    const scroll = page.locator('.mx-fullscreen-scroll').filter({ has: screen })
    const collapsedBar = screen.getByTestId('profile-collapsed-bar')
    // Само наличие overflow ещё не доказывает, что поверхность уже приняла
    // новую высоту: visualViewport обновляет её отдельно от окна браузера.
    await expect.poll(() => scroll.evaluate(el => {
      const surface = el.closest('.mx-fullscreen-surface')
      return Math.round(surface.getBoundingClientRect().height)
    })).toBe(320)
    await expect.poll(() => scroll.evaluate(el => el.scrollHeight - el.clientHeight))
      .toBeGreaterThan(0)
    // Повторяем реальную прокрутку при пересчёте layout и ждём именно ухода
    // большого заголовка выше шапки. Синтетическое событие не подменяет скролл.
    await expect.poll(() => scroll.evaluate(el => {
      el.scrollTop = el.scrollHeight
      const title = el.querySelector('[data-testid="profile-page-title"]')
      const bar = el.querySelector('[data-testid="profile-collapsed-bar"]')
      return title.getBoundingClientRect().bottom < Math.max(0, Math.round(bar.getBoundingClientRect().top))
    })).toBe(true)
    await expect(collapsedBar).toHaveClass(/--collapsed/)
    await expect(collapsedBar).toHaveCSS('background-color', 'rgb(5, 4, 3)')
    await page.evaluate(() => window.__telegramBackClick())
    await expect(page.getByTestId('profile-screen')).toBeVisible()
    await expect(page.getByTestId('profile-close-button')).toHaveCount(0)
  } finally {
    await context.close()
  }
})

test('прямые демо-ссылки ведут на три внутренних экрана', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  for (const [action, id] of [
    ['profile_wtp', 'profile-screen-wtp'],
    ['profile_checkins', 'profile-sub-checkins'],
    ['profile_about', 'profile-sub-about'],
  ]) {
    await page.goto(`/?demo=1&action=${action}`)
    await expect(page.getByTestId(id)).toBeVisible()
  }
})
