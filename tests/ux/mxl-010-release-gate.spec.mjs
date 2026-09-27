import { expect, test } from '@playwright/test'
import {
  scaleStep,
  textStep,
  emotionStep,
  completeCheckin,
  feedbackStep,
  backToToday,
  openDayCard,
  goBack,
  expectWeekStrip,
  dayFocusStep,
} from './checkin-helpers.mjs'

const TEST_USER = {
  id: 900010,
  first_name: 'Release QA',
  username: 'release_qa_fixture',
}

const LONG_AI_REPLY = `Это безопасный fixture-ответ для проверки длинного AI-сообщения. ${'Следующий спокойный шаг помогает удерживать внимание без лишнего давления. '.repeat(45)}`

function jsonResponse(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

function buildFixtureRouter() {
  let checkin = null
  let reviewHour = 24
  const savedCheckins = []
  const sentMessages = []
  const sentFeedback = []

  return {
    savedCheckins,
    sentMessages,
    sentFeedback,
    async handle(route) {
      const request = route.request()
      const url = new URL(request.url())
      const { pathname } = url

      if (pathname === '/api/checkin' && request.method() === 'POST') {
        const payload = request.postDataJSON()
        const reviewCompleted = payload.review_completed === true
        if (!reviewCompleted) reviewHour = 0
        checkin = {
          id: 7010,
          mood: payload.mood,
          energy: payload.energy,
          anxiety: payload.anxiety,
          focus: payload.focus,
          sleep_quality: payload.sleep_quality,
          day_focus: payload.day_focus || null,
          note: payload.note || null,
          lessons: payload.lessons || null,
          wins: payload.wins || null,
          review_completed_at: reviewCompleted ? '2026-08-29T18:00:00.000Z' : null,
        }
        savedCheckins.push(payload)
        return route.fulfill(jsonResponse(checkin))
      }

      if (pathname === '/api/mentalix/messages' && request.method() === 'POST') {
        const payload = request.postDataJSON()
        sentMessages.push(payload)
        return route.fulfill(
          jsonResponse({
            id: `fixture-reply-${sentMessages.length}`,
            role: 'assistant',
            content: LONG_AI_REPLY,
          })
        )
      }

      if (pathname.match(/^\/api\/checkins\/\d+\/feedback$/) && request.method() === 'POST') {
        sentFeedback.push(request.postDataJSON())
        return route.fulfill(jsonResponse({ ok: true }))
      }

      if (request.method() !== 'GET') return route.fulfill(jsonResponse({ ok: true }))

      if (pathname === '/api/profile') return route.fulfill(jsonResponse(TEST_USER))
      if (pathname === '/api/checkin/today') return route.fulfill(jsonResponse(checkin))
      if (pathname === '/api/checkin/history') {
        return route.fulfill(jsonResponse(checkin ? [checkin] : []))
      }
      if (pathname === '/api/rituals') {
        return route.fulfill(jsonResponse([{ id: 701, title: 'Fixture ritual', today_level: null }]))
      }
      if (pathname === '/api/ascezas') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/quotes/today') {
        return route.fulfill(jsonResponse({ text: 'Fixture quote.' }))
      }
      if (pathname === '/api/profile/settings') return route.fulfill(jsonResponse({ review_hour: reviewHour }))
      if (pathname === '/api/analytics/pulse') return route.fulfill(jsonResponse({ active_today: 1 }))
      if (pathname === '/api/analytics') {
        return route.fulfill(jsonResponse({ period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] }))
      }
      if (pathname === '/api/pinned-practices') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/articles') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/themes') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/mentalix/consent') return route.fulfill(jsonResponse({ context_consent: false }))
      if (pathname === '/api/mentalix/messages') {
        return route.fulfill(
          jsonResponse([{ id: 'fixture-history-1', role: 'assistant', content: 'История fixture.' }])
        )
      }

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

test.describe('MXL-010 automated technical gate', () => {
  test('web auth fallback after guest failure exposes email and Telegram without private data', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } })
    const fixtures = buildFixtureRouter()
    await context.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
      try {
        delete window.Telegram
      } catch {
        window.Telegram = undefined
      }
    })
    let guestRequests = 0
    await context.route('**/api/**', route => {
      if (new URL(route.request().url()).pathname === '/api/auth/guest') {
        guestRequests += 1
        return route.fulfill(jsonResponse({ error: 'unavailable' }, 503))
      }
      return fixtures.handle(route)
    })
    const page = await context.newPage()

    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Продолжай расти даже вне приложения.' })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
    await expect(page.locator('form')).toHaveCount(1)
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Получить письмо' })).toBeVisible()
    await expect(page.getByTestId('web-auth-guest-button')).toBeEnabled()
    expect(guestRequests).toBe(1)

    await context.close()
  })

  test('fixture-backed journey covers check-in, completion, evening review, handoff, AI response and reopen', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    const fixtures = buildFixtureRouter()
    await seedUser(context)
    await context.route('**/api/**', route => fixtures.handle(route))
    const page = await context.newPage()
    // Замораживаем время на 08:00 UTC — до времени разбора (19:00) утренняя
    // карточка active, вечерняя locked (§5.1, todayCardState).
    // UTC гарантирует, что new Date().getHours() ≥ 19 после перевода clocks.
    await page.clock.setFixedTime('2026-09-23T08:00:00Z')
    await page.goto('/')

    // ── Утренний чек-ин ──
    await openDayCard(page, 'morning')
    await expect(page.getByRole('radiogroup', { name: 'Как ты сейчас?' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^(Назад|Сегодня)$/ })).toBeVisible()
    await expect(page.locator('[data-testid="checkin-next"]')).toBeVisible()

    // Шкалы: mood=3, sleep_quality=3, energy=3, focus=3
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await scaleStep(page, 3)

    // Главный фокус дня
    await dayFocusStep(page, 'Fixture day focus')

    // Текстовый шаг → завершение (submitTestId=checkin-complete вызывает finish)
    await textStep(page, 'Fixture morning note', 'checkin-complete')

    // Экран завершения
    await expect(page.getByRole('heading', { name: 'Чек-ин завершён' })).toBeVisible()
    expect(fixtures.savedCheckins).toHaveLength(1)
    expect(fixtures.savedCheckins[0].note).toContain('Fixture morning note')
    expect(fixtures.savedCheckins[0].sleep_quality).toBe(3)
    expect(fixtures.savedCheckins[0].day_focus).toBe('Fixture day focus')
    expect(fixtures.sentFeedback).toEqual([])

    // ── Возврат и переход к вечернему разбору ──
    // После утреннего чек-ина fixture меняет review_hour на 0 (→ 19:00 в
    // resolveTodayCardStates). Переводим часы на 19:00, чтобы вечерняя
    // карточка стала active (button), а не locked (div).
    await page.clock.setFixedTime('2026-09-23T19:00:00Z')
    await backToToday(page)
    await openDayCard(page, 'evening')

    // ── Вечерний разбор ──
    await expect(page.getByRole('heading', { name: 'Что ближе всего к тому, что ты чувствуешь?' })).toBeVisible()
    await emotionStep(page, 'ровно')
    await page.locator('[data-testid="checkin-next"]').click()

    // Три текстовых шага
    for (const value of ['Fixture result', 'Fixture difficulty', 'Fixture lesson']) {
      await textStep(page, value)
    }

    // Экран завершения вечернего разбора
    await expect(page.getByRole('heading', { name: /Готово\./ })).toBeVisible()
    expect(fixtures.savedCheckins).toHaveLength(2)
    expect(fixtures.savedCheckins[1].review_completed).toBe(true)

    // Ответ «Немного» уходит сразу: запись уже сохранена
    await feedbackStep(page, 'some')
    await expect
      .poll(() => fixtures.sentFeedback.length, { message: 'ответ разбора дошёл до бэкенда' })
      .toBe(1)
    expect(fixtures.sentFeedback[0]).toEqual({ value: 'some' })

    // ── Хендофф к Следопыту ──
    const scoutBtn = page.locator('[data-testid="checkin-open-scout"]')
    await expect(scoutBtn).toBeVisible()
    await scoutBtn.click()
    await expect(page).toHaveURL(/tab=mentor/)
    await expect(page.locator('#root')).not.toHaveText('', { timeout: 30_000 })

    // ── AI-диалог ──
    const chatInput = page.locator('[data-testid="mentor-input"]')
    await expect(chatInput).toBeVisible()
    await chatInput.fill('Fixture AI question')
    await chatInput.press('Enter')
    await expect(page.getByText('Fixture AI question')).toBeVisible()
    await expect(page.getByText(LONG_AI_REPLY.slice(0, 70))).toBeVisible()

    // Раскрыть длинный ответ
    const expandBtn = page.locator('[data-testid="ai-expand-reply"]')
    await expect(expandBtn).toBeVisible()
    await expandBtn.click()
    await expect(page.getByText('Свернуть ответ')).toBeVisible()

    // ── Возврат на Today ──
    await goBack(page)
    await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
    // Первый Back закрывает conversation и оставляет fullscreen picker Mentor;
    // возврат на Today выполняется следующим шагом browser history.
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()

    // ── Перезагрузка ──
    await page.reload()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()
    expect(fixtures.savedCheckins.filter(item => item.review_completed === true)).toHaveLength(1)

    // ── Календарь недели ──
    await expectWeekStrip(page)

    await context.close()
  })
})
