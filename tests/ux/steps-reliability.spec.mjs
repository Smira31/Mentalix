import { expect, test } from '@playwright/test'

/*
 * «Шаги: надёжность» — прокрутка при возврате, двойной тап «Сохранить» в
 * журнале, ошибка загрузки темы с «Повторить», чипс поиска «Журнал»,
 * третья карточка ряда на 375.
 */

const TEST_USER = { id: 900992, first_name: 'Steps', username: 'steps_reliability' }

const THEME = {
  id: 1,
  title: 'Выбор',
  subtitle: 'Неделя про выбор',
  is_current: true,
  current_day: 1,
  total_days: 3,
  days: [
    { day: 1, text: 'Что ты выбираешь сегодня?', prompt: 'Один выбор', reflection: null },
    { day: 2, text: 'От чего откажешься?', prompt: 'Один отказ', reflection: null },
    { day: 3, text: 'Что останется?', prompt: 'Одна вещь', reflection: null },
  ],
}

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function openMocked(browser, baseURL, { viewport, handlers = {}, path = '/?tab=practices' }) {
  const context = await browser.newContext({
    baseURL,
    viewport,
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
  }, TEST_USER)
  await context.route('**/api/**', async route => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    const key = `${request.method()} ${pathname}`
    if (handlers[key]) return handlers[key](route)
    if (request.method() !== 'GET') return route.fulfill(json({ ok: true }))
    if (pathname === '/api/profile') return route.fulfill(json(TEST_USER))
    if (pathname === '/api/rituals' || pathname === '/api/ascezas') return route.fulfill(json([]))
    if (pathname === '/api/themes') return route.fulfill(json([THEME]))
    if (pathname === '/api/themes/1') return route.fulfill(json(THEME))
    if (pathname === '/api/daily-journal/setup') {
      return route.fulfill(
        json({ updated_at: null, goals: [], reminders: [], vision: {}, prompts: ['Что сегодня было главным?'] })
      )
    }
    if (pathname === '/api/daily-journal/entries') {
      return route.fulfill(json({ items: [], total_days: 0 }))
    }
    return route.fulfill(json({}))
  })
  const page = await context.newPage()
  await page.goto(path)
  return { context, page }
}

test('Шаги: «Назад» из журнала возвращает на то же место прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 560 })
  await page.goto('/?demo=1&tab=practices')
  await expect(page.getByTestId('journal-open-cta')).toBeVisible()

  const scrolled = await page.evaluate(async () => {
    const root = document.querySelector('.mx-app-scroll-root')
    root.scrollTop = 220
    await new Promise(resolve => setTimeout(resolve, 150))
    return root.scrollTop
  })
  expect(scrolled).toBeGreaterThan(100)

  await page.getByTestId('journal-open-cta').click({ force: true })
  await expect(page.getByTestId('dj-intro-skip')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('journal-open-cta')).toBeAttached()

  await expect
    .poll(() => page.evaluate(() => document.querySelector('.mx-app-scroll-root').scrollTop))
    .toBeGreaterThan(scrolled - 3)
})

test('Журнал: двойной тап «Сохранить» отправляет один запрос', async ({ browser, baseURL }) => {
  let posts = 0
  const { context, page } = await openMocked(browser, baseURL, {
    viewport: { width: 393, height: 852 },
    handlers: {
      'POST /api/daily-journal/entries': async route => {
        posts += 1
        await new Promise(resolve => setTimeout(resolve, 700))
        await route.fulfill(json({ id: 1, day_number: 1 }))
      },
    },
  })
  try {
    await page.getByTestId('journal-open-cta').click()
    await page.getByTestId('dj-intro-skip').click()
    await page.getByTestId('dj-stream-input').fill('Тест потока')
    await page.getByTestId('dj-stream-next').click()
    await page.getByTestId('dj-question-input').fill('Тест ответа')
    await page.getByTestId('dj-question-next').dblclick()
    await expect(page.getByTestId('dj-complete-close')).toBeVisible()
    expect(posts).toBe(1)
  } finally {
    await context.close()
  }
})

test('Тема недели: ошибка загрузки показывает «Повторить»', async ({ browser, baseURL }) => {
  let failDetail = false
  const { context, page } = await openMocked(browser, baseURL, {
    viewport: { width: 393, height: 852 },
    handlers: {
      'GET /api/themes/1': route =>
        failDetail ? route.fulfill(json({ error: 'boom' }, 500)) : route.fulfill(json(THEME)),
    },
  })
  try {
    const card = page.getByTestId('theme-carousel-card').first()
    await expect(card).toBeVisible()
    failDetail = true
    await card.click()
    await expect(page.getByTestId('theme-load-error')).toBeVisible()
    await expect(page.getByTestId('theme-load-retry')).toBeVisible()

    failDetail = false
    await page.getByTestId('theme-load-retry').click()
    await expect(page.getByTestId('theme-load-error')).toHaveCount(0)
    await expect(page.getByTestId('theme-day-label')).toContainText('День 1 из 3')
  } finally {
    await context.close()
  }
})

test('Поиск: чипс «Журнал» даёт результат', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto('/?demo=1&tab=practices')
  await page.getByTestId('steps-search-open').click()
  await page.getByTestId('steps-search-chip').filter({ hasText: 'Журнал' }).click()
  await expect(page.getByTestId('steps-search-result').first()).toBeVisible()
  await expect(page.getByTestId('steps-search-result').first()).toContainText('Страница для себя')
})

test('Шаги 375: третья карточка ряда выглядывает', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/?demo=1&tab=practices')
  const cards = page.locator('.mx-steps-rail-card')
  await expect(cards).toHaveCount(3)
  const box = await cards.nth(2).boundingBox()
  const peek = 375 - box.x
  expect(peek).toBeGreaterThanOrEqual(15)
  expect(peek).toBeLessThanOrEqual(40)
})
