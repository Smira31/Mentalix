import { expect, test } from '@playwright/test'
import { mskDayKey, shiftMskDay, mskCalendarLabel } from '../../src/lib/mskDate.js'

const USER = { id: 900993, first_name: 'Тема', username: 'theme_daily' }
const today = mskDayKey(new Date())

function themeFixture({ currentDay = 3, answeredToday = false } = {}) {
  return {
    id: 2,
    title: 'Внимание',
    subtitle: 'Один вопрос в день',
    is_current: true,
    current_day: currentDay,
    started_on: shiftMskDay(today, 1 - currentDay),
    server_date: today,
    total_days: 7,
    days: Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      text: `Вопрос дня ${i + 1}`,
      prompt: 'Одно наблюдение',
      reflection: answeredToday && i + 1 === currentDay ? 'Сегодняшний ответ' : null,
    })),
  }
}

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function openMocked(browser, baseURL, options = {}) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 393, height: 852 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.addInitScript(user => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
    window.__MX_TODAY_RETRY_DELAYS_MS__ = [0, 0, 0]
  }, USER)
  let theme = themeFixture(options)
  const writes = []
  await context.route('**/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path === '/api/themes/2/reflect') {
      const body = request.postDataJSON()
      writes.push(body)
      if (options.locked) {
        return route.fulfill(json({ code: 'day_locked', opens_on: shiftMskDay(today, 1) }, 409))
      }
      theme = {
        ...theme,
        days: theme.days.map(d => (d.day === body.day ? { ...d, reflection: body.text } : d)),
      }
      return route.fulfill(json({ ...theme, current_day: options.reflectCurrentDay ?? theme.current_day }))
    }
    if (request.method() !== 'GET') return route.fulfill(json({ ok: true }))
    if (path === '/api/profile') return route.fulfill(json(USER))
    // Текущая тема намеренно НЕ первая. Прошлый день намеренно пропущен.
    if (path === '/api/themes')
      return route.fulfill(
        json([{ ...themeFixture(), id: 1, title: 'Архив', is_current: false }, theme])
      )
    if (path === '/api/themes/2') return route.fulfill(json(theme))
    if (path === '/api/rituals' || path === '/api/ascezas' || path === '/api/checkin/history') {
      return route.fulfill(json([]))
    }
    if (path === '/api/checkin/today') return route.fulfill(json(null))
    return route.fulfill(json({}))
  })
  const page = await context.newPage()
  await page.goto(options.path || '/?tab=practices')
  return { page, context, writes }
}

const card = (page, day) =>
  page.getByTestId('theme-carousel-card').and(page.locator(`[data-day="${day}"]`))

test('Будущая карточка не открывается; пропущенный прошлый день доступен; «Назад» в Шаги', async ({
  browser,
  baseURL,
}) => {
  const { page, context } = await openMocked(browser, baseURL)
  try {
    await expect(card(page, 3)).toHaveAttribute('data-active', 'true')
    await expect(card(page, 3)).toContainText('Вопрос дня 3')
    await expect(card(page, 4)).toHaveAttribute('data-open', 'false')
    await expect(card(page, 4)).toContainText('Откроется завтра')
    await expect(card(page, 7)).toContainText('Откроется через 4 дн.')
    const future = card(page, 4)
    await expect(future).toHaveCSS('opacity', '1')
    for (const property of ['background-color', 'border-top-color', 'border-top-width']) {
      await expect(future).toHaveCSS(
        property,
        await card(page, 3).evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)
      )
    }
    const question = future.getByTestId('theme-card-question')
    const mask = 'linear-gradient(to right, rgb(0, 0, 0) 30%, rgba(0, 0, 0, 0) 75%)'
    await expect(question).toHaveCSS('filter', 'none')
    await expect(question).toHaveCSS('opacity', '0.35')
    await expect(question).toHaveCSS('mask-image', mask)
    await expect(question).toHaveCSS('-webkit-mask-image', mask)
    await expect(question).toHaveAttribute('aria-hidden', 'true')
    await expect(future.getByTestId('theme-card-prompt')).toHaveCount(0)
    for (const testId of ['theme-card-question', 'theme-card-prompt']) {
      await expect(card(page, 3).getByTestId(testId)).toHaveCSS('filter', 'none')
      await expect(card(page, 3).getByTestId(testId)).toHaveCSS('opacity', '1')
      await expect(card(page, 3).getByTestId(testId)).toHaveCSS('mask-image', 'none')
      await expect(card(page, 3).getByTestId(testId)).not.toHaveAttribute('aria-hidden', 'true')
    }
    for (const testId of ['theme-card-day', 'theme-opening-label']) {
      await expect(future.getByTestId(testId)).toHaveCSS('filter', 'none')
      await expect(future.getByTestId(testId)).toHaveCSS('mask-image', 'none')
      await expect(future.getByTestId(testId)).toHaveCSS('opacity', '1')
    }
    await expect(future.getByTestId('theme-card-day')).toHaveCSS('color', 'rgb(153, 153, 153)')
    await expect(future.getByTestId('theme-opening-label')).toHaveCSS('color', 'rgb(136, 136, 136)')
    await expect(future).toHaveAccessibleName('Вопрос 4. Откроется завтра')
    expect(await future.ariaSnapshot()).not.toContain('Вопрос дня 4')
    expect(await future.ariaSnapshot()).not.toContain('Одно наблюдение')
    await card(page, 4).click({ force: true })
    await expect(page.getByTestId('theme-day-label')).toHaveCount(0)
    await card(page, 4).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('theme-day-label')).toHaveCount(0)
    await card(page, 2).click({ force: true })
    await expect(page.getByTestId('theme-day-label')).toContainText('День 2 из 7')
    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('journal-open-cta')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('После ответа день не меняется, ответ сохраняется и перечитывается', async ({
  browser,
  baseURL,
}) => {
  const { page, context, writes } = await openMocked(browser, baseURL, { reflectCurrentDay: 4 })
  try {
    await card(page, 3).click()
    await page.getByTestId('theme-text-input').fill('Моё наблюдение')
    await page.getByTestId('theme-save').click()
    await expect(page.getByTestId('theme-save-success')).toHaveText(
      'Ответ записан. Завтра — новый вопрос'
    )
    await expect(page.getByTestId('theme-day-label')).toHaveText('День 3 из 7')
    await expect(page.getByTestId('theme-day-label')).toHaveAttribute('data-current-day', '4')
    expect(writes).toHaveLength(1)
    expect(writes[0].day).toBe(3)
    expect(writes[0].text.trim()).toBe('Моё наблюдение')
    await page.getByTestId('back-button').click()
    await card(page, 3).click()
    await expect(page.getByTestId('theme-text-input')).toHaveText('Моё наблюдение')
  } finally {
    await context.close()
  }
})

for (const answeredToday of [false, true]) {
  test(`Сегодня открывает текущий день, а не пропущенный (${answeredToday ? 'есть ответ' : 'пусто'})`, async ({
    browser,
    baseURL,
  }) => {
    const { page, context } = await openMocked(browser, baseURL, { path: '/', answeredToday })
    try {
      await expect(page.getByTestId('today-theme-card')).toContainText('День 3 из 7')
      await page.getByTestId('today-theme-card').click()
      await expect(page.getByTestId('theme-day-label')).toHaveText('День 3 из 7')
      if (answeredToday)
        await expect(page.getByTestId('theme-text-input')).toHaveText('Сегодняшний ответ')
      await page.getByTestId('back-button').click()
      await expect(page.getByTestId('today-theme-card')).toBeVisible()
    } finally {
      await context.close()
    }
  })
}

test('409 day_locked показывает дату и сохраняет набранный текст', async ({ browser, baseURL }) => {
  const { page, context } = await openMocked(browser, baseURL, { locked: true })
  try {
    await card(page, 3).click()
    await page.getByTestId('theme-text-input').fill('Не потерять этот ответ')
    await page.getByTestId('theme-save').click()
    await expect(page.getByTestId('theme-save-error')).toHaveText(
      `Этот вопрос откроется ${mskCalendarLabel(shiftMskDay(today, 1))}`
    )
    await expect(page.getByTestId('theme-text-input')).toHaveText('Не потерять этот ответ')
    await expect(page.getByTestId('theme-save-success')).toHaveCount(0)
  } finally {
    await context.close()
  }
})

test('Последний день остаётся на ответе и показывает завершение недели', async ({
  browser,
  baseURL,
}) => {
  const { page, context } = await openMocked(browser, baseURL, { currentDay: 7 })
  try {
    await card(page, 7).click()
    await page.getByTestId('theme-text-input').fill('Последнее наблюдение')
    await page.getByTestId('theme-save').click()
    await expect(page.getByTestId('theme-save-success')).toHaveText('Неделя пройдена')
    await expect(page.getByTestId('theme-day-label')).toHaveText('День 7 из 7')
  } finally {
    await context.close()
  }
})

test('Демо: день 3, будущие закрыты, сохранение не продвигает календарь', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('/?demo=1&tab=practices')
  await expect(card(page, 3)).toHaveAttribute('data-active', 'true')
  await expect(card(page, 4)).toHaveAttribute('data-open', 'false')
  await card(page, 3).click()
  await page.getByTestId('theme-text-input').fill('Демо-наблюдение')
  await page.getByTestId('theme-save').click()
  await expect(page.getByTestId('theme-save-success')).toBeVisible()
  await expect(page.getByTestId('theme-day-label')).toHaveText('День 3 из 7')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('mentalix_preview_demo_state_v6')).themes[0].current_day
    )
  ).toBe(3)
})
