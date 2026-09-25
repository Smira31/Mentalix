import { expect, test } from '@playwright/test'

const TEST_USER = {
  id: 900001,
  first_name: 'UX',
  username: 'local_swipe_check',
}

const FIXTURES = {
  rituals: [],
  ascezas: [],
  quote: { text: 'Один спокойный шаг важнее идеального плана.' },
  checkin: null,
  history: [],
  themes: [],
  settings: { review_hour: 24 },
  pulse: { active_today: 0 },
  pinnedPractices: [],
  articles: [],
  analytics: {
    period_days: 14,
    rituals: [],
    ascezas: [],
    insights: [],
    daily_activity: [],
  },
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
    if (pathname === '/api/checkin') return jsonResponse({ mood: 3, energy: 3 })
    return jsonResponse({ ok: true })
  }

  if (pathname === '/api/profile')
    return jsonResponse({ ...TEST_USER, total_checkins: 0, days_active: 0 })
  if (pathname === '/api/rituals') return jsonResponse(FIXTURES.rituals)
  if (pathname === '/api/ascezas') return jsonResponse(FIXTURES.ascezas)
  if (pathname === '/api/quotes/today') return jsonResponse(FIXTURES.quote)
  if (pathname === '/api/checkin/today') return jsonResponse(FIXTURES.checkin)
  if (pathname === '/api/checkin/history') return jsonResponse(FIXTURES.history)
  if (pathname === '/api/themes') return jsonResponse(FIXTURES.themes)
  if (pathname === '/api/profile/settings') return jsonResponse(FIXTURES.settings)
  if (pathname === '/api/analytics/pulse') return jsonResponse(FIXTURES.pulse)
  if (pathname === '/api/pinned-practices') return jsonResponse(FIXTURES.pinnedPractices)
  if (pathname === '/api/mood-practices') return jsonResponse([])
  if (pathname === '/api/practice-days') return jsonResponse({ days: [] })
  if (pathname === '/api/articles') return jsonResponse(FIXTURES.articles)
  if (pathname === '/api/analytics') return jsonResponse(FIXTURES.analytics)
  if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
  if (pathname === '/api/mentalix/messages') return jsonResponse([])

  return jsonResponse({ ok: true })
}

/*
 * Симуляция тач-свайпа вниз по элементу.
 * Playwright не имеет встроенного API для touch-drag, поэтому
 * диспатчим TouchEvent вручную на целевой элемент.
 */
async function swipeDownOnElement(page, selector, distance = 400) {
  await page.evaluate(
    ({ selector, distance }) => {
      const el = document.querySelector(selector)
      if (!el) throw new Error(`Элемент не найден: ${selector}`)

      const rect = el.getBoundingClientRect()
      const startX = rect.left + rect.width / 2
      const startY = rect.top + 30 // зона ручки/заголовка

      function makeTouch(x, y) {
        return new Touch({
          identifier: 0,
          target: el,
          clientX: x,
          clientY: y,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0,
          force: 1,
        })
      }

      function dispatch(type, touch, cancelable = true) {
        const event = new TouchEvent(type, {
          touches: type === 'touchend' ? [] : [touch],
          targetTouches: type === 'touchend' ? [] : [touch],
          changedTouches: [touch],
          bubbles: true,
          cancelable,
        })
        el.dispatchEvent(event)
      }

      const startTouch = makeTouch(startX, startY)
      dispatch('touchstart', startTouch)

      const steps = 12
      for (let i = 1; i <= steps; i++) {
        const y = startY + (distance * i) / steps
        dispatch('touchmove', makeTouch(startX, y))
      }

      dispatch('touchend', makeTouch(startX, startY + distance))
    },
    { selector, distance }
  )
}

test.describe('Свайп-жесты', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(user => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    }, TEST_USER)

    await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  })

  test('свайп вниз закрывает шторку огонька', async ({ page }) => {
    await page.goto('/')

    // Открываем экран серии/значков через чип огонька
    const streakChip = page.locator('[data-testid="today-streak-chip"]')
    await expect(streakChip).toBeVisible()
    await streakChip.click()

    // Ждём появления экрана значков
    await expect(page.getByRole('tab', { name: 'Значки' })).toBeVisible()

    // Открываем шторку значка — первый ряд
    const badgeRow = page.getByRole('button', { name: /Открыть значок/ }).first()
    await expect(badgeRow).toBeVisible()
    await badgeRow.click()

    // Шторка значка видна
    const badgeSheet = page.locator('.mx-badge-sheet')
    await expect(badgeSheet).toBeVisible()

    // Свайп вниз по шторке
    await swipeDownOnElement(page, '.mx-badge-sheet', 500)

    // Шторка должна закрыться (onClose → setSelectedBadge(null))
    await expect(badgeSheet).not.toBeVisible({ timeout: 5_000 })
  })
})
