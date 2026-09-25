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
  if (pathname === '/api/checkin/history') {
    // Динамическая запись за вчера — нужна для теста свайпа из HistoryDetail
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return jsonResponse([
      {
        id: 900500,
        date: yesterday.toISOString().slice(0, 10),
        mood: 3,
        energy: 4,
        note: 'Спокойный день.',
        emotion: 'ровно',
        review_completed_at: new Date().toISOString(),
      },
    ])
  }
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

/*
 * Симуляция тач-свайпа от левого края экрана (жест «назад»).
 * Начинается в полосе 24px от левого края (EDGE_WIDTH),
 * проходит >35% ширины экрана (порог срабатывания).
 */
async function swipeRightFromEdge(page, selector) {
  await page.evaluate(selector => {
    const el = document.querySelector(selector)
    if (!el) throw new Error(`Элемент не найден: ${selector}`)

    const startX = 0 // левый край, в полосе EDGE_WIDTH (24px)
    const rect = el.getBoundingClientRect()
    const startY = rect.top + rect.height / 2
    const distance = window.innerWidth * 0.5 // 50% ширины > порога 35%

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
      const x = startX + (distance * i) / steps
      dispatch('touchmove', makeTouch(x, startY))
    }

    dispatch('touchend', makeTouch(startX + distance, startY))
  }, selector)
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

  test('свайп от левого края закрывает экран чек-ина', async ({ page }) => {
    await page.goto('/')

    // Открываем утренний чек-ин через карточку дня
    const morningCard = page.locator('[data-testid="today-card-morning"]')
    await expect(morningCard).toBeVisible()
    await morningCard.click()

    // Ждём появления шкалы настроения
    await expect(page.locator('[data-testid="checkin-scale-row"]')).toBeVisible()

    // Свайп от левого края по порталу чек-ина
    await swipeRightFromEdge(page, '.mx-demo-checkin')

    // Возврат на экран Сегодня
    await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible({ timeout: 5_000 })
  })

  test('свайп от левого края закрывает экран серии и значков', async ({ page }) => {
    await page.goto('/')

    // Открываем экран серии/значков через чип огонька
    const streakChip = page.locator('[data-testid="today-streak-chip"]')
    await expect(streakChip).toBeVisible()
    await streakChip.click()

    // Ждём появления экрана значков
    await expect(page.getByRole('tab', { name: 'Значки' })).toBeVisible()

    // Свайп от левого края по поверхности серии
    await swipeRightFromEdge(page, '.mx-path-surface')

    // Возврат на экран Сегодня
    await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible({ timeout: 5_000 })
  })

  test('свайп от левого края закрывает экран профиля', async ({ page }) => {
    await page.goto('/')

    // Открываем профиль через кнопку профиля
    const profileButton = page.locator('[data-testid="today-profile-button"]')
    await expect(profileButton).toBeVisible()
    await profileButton.click()

    // Ждём появления экрана профиля
    await expect(page.locator('[data-testid="profile-screen"]')).toBeVisible()

    // Свайп от левого края по экрану профиля
    await swipeRightFromEdge(page, '[data-testid="profile-screen"]')

    // Возврат на экран Сегодня
    await expect(page.locator('[data-testid="today-streak-chip"]')).toBeVisible({ timeout: 5_000 })
  })

  test('свайп от левого края закрывает детальную запись истории', async ({ page }) => {
    await page.goto('/?tab=history')

    // Ждём загрузки списка истории
    const dayButton = page.getByRole('button', { name: /Открыть запись за/ })
    await expect(dayButton).toBeVisible({ timeout: 10_000 })

    // Открываем детальную запись дня
    await dayButton.click()

    // Ждём появления детального экрана
    const detailSection = page.locator('[aria-label^="Запись за"]')
    await expect(detailSection).toBeVisible()

    // Свайп от левого края по секции детальной записи
    await swipeRightFromEdge(page, '[aria-label^="Запись за"]')

    // Возврат к списку истории — кнопка поиска записей видна снова
    await expect(page.getByText('Искать и фильтровать записи')).toBeVisible({ timeout: 5_000 })
  })
})
