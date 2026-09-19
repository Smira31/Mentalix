import { expect, test } from '@playwright/test'

const TEST_USER = { id: 900648, first_name: 'Issue 648', username: 'issue_648' }

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
      return route.fulfill(json({ error: `forced failure: ${pathname}` }, 503))
    }
    if (route.request().method() !== 'GET') return route.fulfill(json({ ok: true }))
    if (pathname === '/api/profile') return route.fulfill(json(TEST_USER))
    if (pathname === '/api/rituals' || pathname === '/api/ascezas') return route.fulfill(json([]))
    if (pathname === '/api/checkin/history') return route.fulfill(json([]))
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
  await expect(page.getByRole('button', { name: 'Профиль' })).toBeVisible()
  return { context, page }
}

test('Profile keeps profile data visible when rituals fail', async ({ browser, baseURL }) => {
  const { context, page } = await openApp(browser, baseURL, new Set(['/api/rituals']))
  try {
    await page.getByRole('button', { name: 'Профиль' }).click()
    await page.getByText('Профиль и мой путь').click()
    await expect(page.getByRole('heading', { name: 'мой путь.' })).toBeVisible()
    await expect(page.getByText(/Issue 648 дней в системе/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Повторить' }).first()).toBeEnabled()
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
    await page.getByRole('button', { name: 'Прогресс' }).click()
    await expect(page.getByRole('heading', { name: 'прогресс.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Очень тяжело' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Очень тяжело' })).toBeEnabled()
    await expect(page.getByRole('alert')).toContainText(/статистик|прогресс/i)
  } finally {
    await context.close()
  }
})
