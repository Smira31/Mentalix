import { expect, test } from '@playwright/test'
import { moodPracticeStart } from './checkin-helpers.mjs'

/*
 * Области нажатия ≥43×43 pt и отступ капсулы «← Назад» (WebKit, iPhone 15 Pro).
 *
 * 1) Мелкие кнопки расширены невидимо (класс .mx-tap-target в index.css):
 *    видимый размер и раскладка не меняются, а нажатие у краёв квадрата
 *    43×43 вокруг центра кнопки должно попадать в саму кнопку. Проверяем
 *    это в демо-режиме (?demo=1): крестики подсказок на «Сегодня»,
 *    «Настроить твои практики», «Пропустить» в чек-ине, вкладки и
 *    «Закрыть» в шторке серии.
 * 2) Вне Telegram у чек-ина и «Настроения» своя капсула «Назад»: её левый
 *    край стоит на 16 pt от края экрана (--mx-screen-x), на одной линии с
 *    левым краем текста. Допуск ±1 pt.
 *
 * Поиск — только по data-testid; вместо ожиданий таймером — ожидание
 * состояния (expect.poll / toBeVisible).
 */

const MIN_TAP_PT = 43
const SCREEN_X_PT = 16
const SCREEN_X_TOLERANCE_PT = 1

const IPHONE_15_PRO_VIEWPORT = { width: 393, height: 852 }

// Подсказки на «Сегодня» видны по одной: сначала о серии, после её
// закрытия — о карточках. Обе области нажатия проверяются по очереди.
const TODAY_TAP_TARGETS = ['series-tooltip-close', 'pinned-practices-manage']
const TODAY_NEXT_HINT_TAP_TARGET = 'today-cards-hint-close'

const SERIES_TAP_TARGETS = ['series-tab-badges', 'series-tab-stats', 'series-close']

const CHECKIN_TAP_TARGETS = ['checkin-skip']

/**
 * Сколько точек у краёв квадрата MIN_TAP_PT вокруг центра кнопки не
 * попадают в саму кнопку. 0 — область нажатия не меньше MIN_TAP_PT.
 */
async function tapAreaMisses(page, testId) {
  return page.evaluate(
    ({ testId, min }) => {
      const el = document.querySelector(`[data-testid="${testId}"]`)
      if (!el) return { found: false, misses: null, size: null }

      const rect = el.getBoundingClientRect()
      // Демо-рамка масштабирует поверхность: pt переводим в CSS-px через
      // отношение отрисованной ширины к собственной ширине элемента.
      const scale = el.offsetWidth ? rect.width / el.offsetWidth : 1
      const half = (min / 2) * scale
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const points = [
        [-half, 0],
        [half, 0],
        [0, -half],
        [0, half],
        [-half * 0.98, -half * 0.98],
        [half * 0.98, half * 0.98],
      ]

      const misses = points.filter(([dx, dy]) => {
        const hit = document.elementFromPoint(cx + dx, cy + dy)
        return !hit || !(hit === el || el.contains(hit))
      }).length

      return { found: true, misses, size: [Math.round(rect.width), Math.round(rect.height)] }
    },
    { testId, min: MIN_TAP_PT }
  )
}

/** Ждём состояние: нажатие у краёв квадрата 43×43 попадает в кнопку. */
async function expectTapArea(page, testId) {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible()
  await expect
    .poll(async () => (await tapAreaMisses(page, testId)).misses, {
      message: `Область нажатия [data-testid="${testId}"] меньше ${MIN_TAP_PT}×${MIN_TAP_PT} pt`,
    })
    .toBe(0)
}

/** Левый край капсулы «Назад» = 16 pt от края экрана (±1 pt). */
async function expectBackPillOffset(page) {
  const pill = page.locator('[data-testid="back-button"]')
  await expect(pill).toBeVisible()
  const box = await pill.boundingBox()
  expect(box, 'капсула «Назад» должна иметь bounding box').not.toBeNull()
  expect(
    Math.abs(box.x - SCREEN_X_PT),
    `левый край капсулы «Назад» ${box.x} pt ≠ ${SCREEN_X_PT} pt (±${SCREEN_X_TOLERANCE_PT})`
  ).toBeLessThanOrEqual(SCREEN_X_TOLERANCE_PT)
}

test.describe('Области нажатия и отступ «Назад»', () => {
  test('мелкие кнопки нажимаются с площади ≥43×43 pt (?demo=1)', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: IPHONE_15_PRO_VIEWPORT,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    // Подсказки на «Сегодня» показываются, пока не отмечены просмотренными.
    await context.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    const page = await context.newPage()
    await page.goto('/?demo=1')

    await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()
    for (const testId of TODAY_TAP_TARGETS) {
      await expectTapArea(page, testId)
    }
    await expect(page.locator('[data-testid="today-cards-hint"]')).toBeHidden()
    await page.locator('[data-testid="series-tooltip-close"]').click()
    await expect(page.locator('[data-testid="series-tooltip-close"]')).toBeHidden()
    await expectTapArea(page, TODAY_NEXT_HINT_TAP_TARGET)

    // Шторка серии: вкладки «Значки» / «Статистика» и «Закрыть».
    await page.locator('[data-testid="today-streak-chip"]').click()
    await expect(page.locator('[data-testid="series-tab-badges"]')).toBeVisible()
    for (const testId of SERIES_TAP_TARGETS) {
      await expectTapArea(page, testId)
    }
    await page.locator('[data-testid="series-close"]').click()
    await expect(page.locator('[data-testid="series-tab-badges"]')).toBeHidden()

    // Чек-ин: «Пропустить».
    await page.locator('[data-testid="today-card-morning"]').click()
    for (const testId of CHECKIN_TAP_TARGETS) {
      await expectTapArea(page, testId)
    }

    await context.close()
  })

  test('капсула «Назад» в чек-ине и «Настроении» стоит на 16 pt от левого края', async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(180_000)

    const checkinContext = await fixtureContext(browser, baseURL)
    const checkin = await checkinContext.newPage()
    await checkin.clock.setFixedTime('2026-09-23T08:00:00+03:00')
    await checkin.goto('/')
    await checkin.locator('[data-testid="today-card-morning"]').click()
    await expect(checkin.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
    await expectBackPillOffset(checkin)
    await checkinContext.close()

    const moodContext = await fixtureContext(browser, baseURL)
    const mood = await moodContext.newPage()
    await mood.clock.setFixedTime('2026-09-23T08:00:00+03:00')
    await mood.goto('/?tab=practices')
    await mood.getByRole('button', { name: 'Открыть Настроение' }).click()
    await moodPracticeStart(mood)
    await expectBackPillOffset(mood)
    await moodContext.close()
  })
})

// ── Фикстуры для режима без ?demo=1 (там своя капсула «Назад» видна) ──

const TEST_USER = {
  id: 900030,
  first_name: 'Tap QA',
  username: 'tap_qa_fixture',
}

function jsonResponse(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

function fixtureFor(request) {
  const { pathname } = new URL(request.url())
  const method = request.method()

  if (method !== 'GET') return jsonResponse({ ok: true })

  if (pathname === '/api/profile') return jsonResponse(TEST_USER)
  if (pathname === '/api/rituals') return jsonResponse([])
  if (pathname === '/api/ascezas') return jsonResponse([])
  if (pathname === '/api/quotes/today') return jsonResponse({ text: 'Один спокойный шаг.' })
  if (pathname === '/api/checkin/today') return jsonResponse(null)
  if (pathname === '/api/checkin/history') return jsonResponse([])
  if (pathname === '/api/themes') return jsonResponse([])
  if (pathname === '/api/profile/settings') return jsonResponse({ review_hour: 24 })
  if (pathname === '/api/analytics/pulse') return jsonResponse({ active_today: 0 })
  if (pathname === '/api/pinned-practices') return jsonResponse([])
  if (pathname === '/api/articles') return jsonResponse([])
  if (pathname === '/api/mood-practices') return jsonResponse([])
  if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
  if (pathname === '/api/mentalix/messages') return jsonResponse([])
  if (pathname === '/api/analytics') {
    return jsonResponse({
      period_days: 14,
      rituals: [],
      ascezas: [],
      insights: [],
      daily_activity: [],
    })
  }

  return jsonResponse({ ok: true })
}

async function fixtureContext(browser, baseURL) {
  const context = await browser.newContext({
    baseURL,
    viewport: IPHONE_15_PRO_VIEWPORT,
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
  return context
}
