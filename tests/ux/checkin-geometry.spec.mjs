import { expect, test } from '@playwright/test'

/*
 * Геометрия чек-ина (MXL-010): центр ряда шкалы и центр ряда
 * «Нет / Немного / Да» на экране завершения совпадают с центром экрана
 * (±2 px) на эталонных мобильных ширинах 393 (iPhone 16) и 440
 * (iPhone 16 Pro Max). Поиск — только по data-testid; никаких
 * waitForTimeout — только ожидание состояния.
 */

const TEST_USER = {
  id: 900001,
  first_name: 'UX',
  username: 'local_ux_check',
}

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 }, // iPhone 16
  { name: '440x956', width: 440, height: 956 }, // iPhone 16 Pro Max
]

const FIXTURES = {
  rituals: [],
  ascezas: [],
  quote: { text: 'Один спокойный шаг важнее идеального плана.' },
  checkin: null,
  themes: [],
  settings: { review_hour: 24 },
  pulse: { active_today: 12 },
  pinnedPractices: [],
  articles: [],
  analytics: {
    period_days: 14,
    rituals: [],
    ascezas: [],
    insights: [],
    daily_activity: [],
  },
  history: [],
}

function jsonResponse(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

function fixtureFor(request) {
  const url = new URL(request.url())
  const pathname = url.pathname
  const method = request.method()

  if (method !== 'GET') {
    return jsonResponse({ ok: true })
  }

  if (pathname === '/api/profile') return jsonResponse(TEST_USER)
  if (pathname === '/api/rituals') return jsonResponse(FIXTURES.rituals)
  if (pathname === '/api/ascezas') return jsonResponse(FIXTURES.ascezas)
  if (pathname === '/api/quotes/today') return jsonResponse(FIXTURES.quote)
  if (pathname === '/api/checkin/today') return jsonResponse(FIXTURES.checkin)
  if (pathname === '/api/checkin/history') return jsonResponse(FIXTURES.history)
  if (pathname === '/api/themes') return jsonResponse(FIXTURES.themes)
  if (pathname === '/api/profile/settings') return jsonResponse(FIXTURES.settings)
  if (pathname === '/api/analytics/pulse') return jsonResponse(FIXTURES.pulse)
  if (pathname === '/api/pinned-practices') return jsonResponse(FIXTURES.pinnedPractices)
  if (pathname === '/api/articles') return jsonResponse(FIXTURES.articles)
  if (pathname === '/api/analytics') return jsonResponse(FIXTURES.analytics)
  if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
  if (pathname === '/api/mentalix/messages') return jsonResponse([])

  return jsonResponse({ error: `Нет локального fixture для ${method} ${pathname}` }, 501)
}

/** Центр ряда по горизонтали совпадает с центром экрана (±2 px). */
async function expectRowCenteredOnScreen(page, testId, viewportName) {
  const box = await page.locator(`[data-testid="${testId}"]`).boundingBox()
  expect(box, `${testId} должен иметь bounding box на ${viewportName}`).not.toBeNull()

  const screenCenter = await page.evaluate(() => window.innerWidth / 2)
  const rowCenter = box.x + box.width / 2
  const drift = Math.abs(rowCenter - screenCenter)

  expect(
    drift,
    `${testId} на ${viewportName}: центр ряда ${rowCenter} ≠ центр экрана ${screenCenter} (допуск ±2 px)`
  ).toBeLessThanOrEqual(2)
}

test('ряды шкал и «Нет/Немного/Да» центрированы по экрану на 393 и 440', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000)

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: viewport.width, height: viewport.height },
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

    await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))

    const page = await context.newPage()
    await page.clock.setFixedTime('2026-09-23T08:00:00+03:00')

    await page.goto('/')
    await page.getByRole('button', { name: /Утренний чек-ин/ }).click()

    // Обе шкалы (настроение, затем энергия): ряд по центру экрана.
    for (const heading of ['Как ты сейчас?', 'Сколько в тебе энергии?']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expectRowCenteredOnScreen(page, 'checkin-scale-row', viewport.name)
      await page.locator('[data-testid="checkin-scale-option"][data-level="3"]').click()
      await page.locator('[data-testid="checkin-next"]').click()
    }

    // Текстовый шаг → экран завершения.
    const editor = page.getByRole('textbox', { name: 'Что на уме' })
    await expect(editor).toBeVisible()
    await editor.pressSequentially('Спокойное утро')
    await page.locator('[data-testid="checkin-next"]').click()

    await expect(page.getByRole('heading', { name: /Утренний чек-ин/ })).toBeVisible()
    await expectRowCenteredOnScreen(page, 'checkin-feedback-row', viewport.name)

    await context.close()
  }
})
