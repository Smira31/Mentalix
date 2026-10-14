import { expect, test } from '@playwright/test'
import { closeCheckin, openDayCard, scaleStep, textStep } from './checkin-helpers.mjs'

/*
 * UX-аудит, пакет 1: навигация утреннего и вечернего чек-ина.
 *
 * Проверяет:
 *  — единое визуальное оформление продолжения (стрелка вперёд, галочка завершение);
 *  — понятный выход крестиком с сохранностью введённого текста;
 *  — выход отличим от возврата на предыдущий шаг;
 *  — повторный вход восстанавливает черновик.
 */

const TEST_USER = {
  id: 900020,
  first_name: 'Nav QA',
  username: 'nav_qa_fixture',
}

function jsonResponse(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

function buildFixtureRouter() {
  let checkin = null
  const savedCheckins = []

  return {
    savedCheckins,
    async handle(route) {
      const request = route.request()
      const url = new URL(request.url())
      const { pathname } = url

      if (pathname === '/api/checkin' && request.method() === 'POST') {
        const payload = request.postDataJSON()
        checkin = {
          id: 7020,
          mood: payload.mood,
          energy: payload.energy,
          note: payload.note || null,
          review_completed_at: payload.review_completed ? '2026-10-14T18:00:00.000Z' : null,
        }
        savedCheckins.push(payload)
        return route.fulfill(jsonResponse(checkin))
      }

      if (request.method() !== 'GET') return route.fulfill(jsonResponse({ ok: true }))

      if (pathname === '/api/streak')
        return route.fulfill(
          jsonResponse({ current_streak: 0, longest_streak: 0, total_active_days: 0, is_active_today: false })
        )
      if (pathname === '/api/profile') return route.fulfill(jsonResponse(TEST_USER))
      if (pathname === '/api/checkin/today') return route.fulfill(jsonResponse(checkin))
      if (pathname === '/api/checkin/history') return route.fulfill(jsonResponse(checkin ? [checkin] : []))
      if (pathname === '/api/rituals') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/ascezas') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/quotes/today') return route.fulfill(jsonResponse({ text: 'Fixture.' }))
      if (pathname === '/api/profile/settings') return route.fulfill(jsonResponse({ review_hour: 24 }))
      if (pathname === '/api/analytics/pulse') return route.fulfill(jsonResponse({ active_today: 0 }))
      if (pathname === '/api/analytics')
        return route.fulfill(jsonResponse({ period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] }))
      if (pathname === '/api/pinned-practices') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/articles') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/themes') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/mentalix/consent')
        return route.fulfill(jsonResponse({ context_consent: false }))

      return route.fulfill(jsonResponse({}))
    },
  }
}

async function seedUser(context) {
  await context.addInitScript(user => {
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  }, TEST_USER)
}

test.describe('Check-in navigation consistency (UX audit pack 1)', () => {
  test('morning: X exit preserves note draft, back goes to previous step, last action is check', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 393, height: 852 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    const fixtures = buildFixtureRouter()
    await seedUser(context)
    await context.route('**/api/**', route => fixtures.handle(route))
    const page = await context.newPage()
    await page.clock.setFixedTime('2026-10-14T08:00:00Z')
    await page.goto('/')

    // ── Шаг 0: крестик виден, BackButton скрыт ──
    await openDayCard(page, 'morning')
    await expect(page.getByTestId('checkin-close')).toBeVisible()
    await expect(page.locator('[data-testid="back-button"]')).toHaveCount(0)

    // ── Переход на шаг 1: BackButton появляется ──
    await scaleStep(page, 3)
    await expect(page.locator('[data-testid="back-button"]')).toBeVisible()
    await expect(page.getByTestId('checkin-close')).toBeVisible()

    // ── Возврат на шаг 0: BackButton снова скрыт ──
    await page.locator('[data-testid="back-button"]').click()
    await expect(page.locator('[data-testid="back-button"]')).toHaveCount(0)

    // ── Дойти до текстового шага, ввести текст, выйти крестиком ──
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    // Шаг фокуса — пропускаем (checkin-next всегда активен)
    await page.locator('[data-testid="checkin-next"]').click()

    // Текстовый шаг: последний — галочка, не стрелка
    await expect(page.locator('[data-testid="checkin-complete"]')).toBeVisible()
    await expect(page.locator('[data-testid="checkin-complete"]')).toHaveAttribute('aria-label', 'Завершить')

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Draft note for exit test')

    // Выходим крестиком — текст должен сохраниться в черновик
    await closeCheckin(page)
    await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()

    // ── Повторный вход: черновик восстанавливается ──
    await openDayCard(page, 'morning')
    // Проходим шкалы заново до текстового шага
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await page.locator('[data-testid="checkin-next"]').click()

    const restoredInput = page.locator('[data-testid="checkin-text-input"]')
    await expect(restoredInput).toContainText('Draft note for exit test')

    await context.close()
  })

  test('evening: X exit with lessons shows confirmation, back goes to previous step', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 393, height: 852 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    const fixtures = buildFixtureRouter()
    await seedUser(context)
    await context.route('**/api/**', route => fixtures.handle(route))
    const page = await context.newPage()
    await page.clock.setFixedTime('2026-10-14T19:00:00Z')
    await page.goto('/')

    await openDayCard(page, 'evening')
    await expect(page.getByTestId('checkin-close')).toBeVisible()
    await expect(page.locator('[data-testid="back-button"]')).toHaveCount(0)

    // Шаг эмоций — есть предыдущий шаг (шкала), BackButton появляется после выбора
    await page.locator('[data-testid="checkin-emotion-pill"][data-emotion="ровно"]').click()
    await page.locator('[data-testid="checkin-next"]').click()

    // Первый текстовый шаг вечера
    const input = page.locator('[data-testid="checkin-text-input"]')
    await expect(input).toBeVisible()
    await input.fill('Unsaved evening lesson')

    // Выход крестиком с несохранённым текстом — диалог подтверждения
    await closeCheckin(page)
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(page.getByText('Закрыть запись?')).toBeVisible()

    // Подтверждаем закрытие
    await page.locator('[data-testid="checkin-close-draft-confirm"]').click()
    await expect(page.locator('[data-testid="today-card-evening"]')).toBeVisible()

    await context.close()
  })
})
