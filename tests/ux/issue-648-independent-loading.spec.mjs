import assert from 'node:assert/strict'
import { expect, test } from '@playwright/test'

const TEST_USER = {
  id: 900648,
  first_name: 'Issue 648',
  username: 'issue_648',
  days_active: 7,
  total_checkins: 3,
}

function json(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function openApp(browser, baseURL, failures) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
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
  }, TEST_USER)
  await context.route('**/api/**', route => {
    const pathname = new URL(route.request().url()).pathname
    if (route.request().method() === 'GET' && failures.has(pathname)) {
      const status = failures instanceof Map ? failures.get(pathname) : 503
      return route.fulfill(json({ error: `forced failure: ${pathname}` }, status))
    }
    if (route.request().method() !== 'GET') return route.fulfill(json({ ok: true }))
    if (pathname === '/api/profile') return route.fulfill(json(TEST_USER))
    if (pathname === '/api/rituals' || pathname === '/api/ascezas') return route.fulfill(json([]))
    if (pathname === '/api/checkin/history') return route.fulfill(json([]))
    if (pathname === '/api/mood-practices') return route.fulfill(json([]))
    if (pathname === '/api/practice-days') return route.fulfill(json({ days: [] }))
    if (pathname === '/api/checkin/today') return route.fulfill(json(null))
    if (pathname === '/api/themes') return route.fulfill(json([]))
    if (pathname === '/api/profile/settings') return route.fulfill(json({ insights_enabled: true }))
    if (pathname === '/api/analytics') {
      return route.fulfill(json({ period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] }))
    }
    if (pathname === '/api/analytics/pulse') return route.fulfill(json({ active_today: 0 }))
    if (pathname === '/api/quotes/today') return route.fulfill(json({ text: 'Fixture quote.' }))
    if (pathname === '/api/articles') return route.fulfill(json([]))
    return route.fulfill(json({}))
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Открыть настройки' })).toBeVisible()
  return { context, page }
}

test('Profile keeps user data visible and does not fetch path sources', async ({ browser, baseURL }) => {
  const requestedUrls = new Set()
  const { context, page } = await openApp(browser, baseURL, new Set(['/api/rituals']))
  try {
    // Ждём, пока «Сегодня» завершит все запросы (включая retry /api/rituals
    // из-за 503), чтобы их не посчитала проверка «о тебе.».
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Открыть настройки' }).click()
    // Слушаем сеть только с момента перехода на «о тебе.» —
    // не считаем запросы «Сегодня» и предзагрузку настроек профиля.
    page.on('request', req => {
      requestedUrls.add(new URL(req.url()).pathname)
    })
    await page.getByTestId('profile-row-about').click()
    await expect(page.getByRole('heading', { name: 'Issue 648' })).toBeVisible()
    // «о тебе.» запрашивает ритуалы, аскезы, историю чек-инов,
    // mood-practices и practice-days для расчёта серии (buildSeriesViewModel),
    // но не запрашивает темы и аналитику
    assert(!requestedUrls.has('/api/themes'))
    assert(!requestedUrls.has('/api/analytics'))
  } finally {
    await context.close()
  }
})

test('Profile shows retry when profile endpoint fails', async ({ browser, baseURL }) => {
  const { context, page } = await openApp(browser, baseURL, new Set(['/api/profile']))
  try {
    await page.getByRole('button', { name: 'Открыть настройки' }).click()
    await page.getByTestId('profile-row-about').click()
    await expect(page.getByRole('heading', { name: 'Issue 648' })).toBeVisible()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeEnabled()
  } finally {
    await context.close()
  }
})

test('Analytics keeps the mood check-in neighbor visible and interactive when analytics/history fail', async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openApp(
    browser,
    baseURL,
    new Set(['/api/analytics', '/api/checkin/history'])
  )
  try {
    await page.goto('/?tab=trends')
    await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeVisible()
    await expect(page.getByText('Как ты себя чувствуешь?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Повторить' }).first()).toBeEnabled()
    await expect(page.getByRole('alert').filter({ hasText: 'Статистика временно недоступна.' })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('Profile and Analytics expose auth recovery for 401/403 responses', async ({ browser, baseURL }) => {
  const { context, page } = await openApp(
    browser,
    baseURL,
    new Map([
      ['/api/profile', 401],
      ['/api/rituals', 403],
      ['/api/analytics', 401],
      ['/api/checkin/history', 403],
    ])
  )
  try {
    await page.goto('/?tab=trends')
    await expect(page.getByRole('heading', { name: 'аналитика.' })).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Статистика требует повторной авторизации.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Повторить' }).first()).toBeEnabled()
  } finally {
    await context.close()
  }
})
