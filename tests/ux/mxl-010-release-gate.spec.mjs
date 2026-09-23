import { expect, test } from '@playwright/test'

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

  return {
    savedCheckins,
    sentMessages,
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
  test('web auth contract is deterministic and does not expose private data', async ({ browser, baseURL }) => {
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
    await context.route('**/api/**', route => fixtures.handle(route))
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
    await expect(page.getByRole('button', { name: /Утренний чек-ин/ })).toBeVisible()

    await page.getByRole('button', { name: /Утренний чек-ин/ }).click()
    await expect(page.getByRole('radiogroup', { name: 'Как ты сейчас?' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^(Назад|Сегодня)$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Далее' })).toBeVisible()

    for (const option of ['Нормально', 'Средне']) {
      await page.getByRole('radio', { name: new RegExp(`^3: ${option}$`, 'i') }).click()
    }

    const morningNote = page.getByRole('textbox', { name: 'Что на уме' })
    await morningNote.fill('Fixture morning note')
    await page.getByRole('button', { name: 'Далее' }).dispatchEvent('click')
    await expect(page.getByRole('heading', { name: /Утренний чек-ин/ })).toBeVisible()
    expect(fixtures.savedCheckins).toHaveLength(0)

    await page.getByRole('button', { name: 'Завершить' }).click()
    await expect(page.getByRole('heading', { name: /-дневная серия\./ })).toBeVisible()
    expect(fixtures.savedCheckins).toHaveLength(1)
    expect(fixtures.savedCheckins[0].note).toContain('Fixture morning note')

    // После утреннего чек-ина fixture меняет review_hour на 0 (→ 19:00 в
    // resolveTodayCardStates). Переводим часы на 19:00, чтобы вечерняя
    // карточка стала active (button), а не locked (div).
    await page.clock.setFixedTime('2026-09-23T19:00:00Z')
    await page.getByRole('button', { name: 'Вернуться в Сегодня' }).click()
    await expect(page.getByRole('button', { name: /Разбор дня/ })).toBeVisible()

    await page.getByRole('button', { name: /Разбор дня/ }).click()
    await expect(page.getByRole('heading', { name: 'Какой был день?' })).toBeVisible()
    await page.getByRole('button', { name: 'ровно' }).click()
    await page.getByRole('button', { name: 'Далее' }).click()

    for (const [label, value] of [
      ['Что получилось?', 'Fixture result'],
      ['Что было трудно?', 'Fixture difficulty'],
      ['Какой вывод забираешь?', 'Fixture lesson'],
    ]) {
      await page.locator(`[aria-label="${label}"]`).fill(value)
      await page.getByRole('button', { name: 'Далее' }).click()
    }

    await expect(page.getByRole('heading', { name: /Разбор дня/ })).toBeVisible()
    expect(fixtures.savedCheckins).toHaveLength(2)
    expect(fixtures.savedCheckins[1].review_completed).toBe(true)

    await page.getByRole('button', { name: 'Разобрать со Следопытом' }).click()
    await expect(page).toHaveURL(/tab=mentor/)
    await expect(page.locator('#root')).not.toHaveText('', { timeout: 30_000 })
    const chatInput = page.locator('input[placeholder^="Написать "]')
    await expect(chatInput).toBeVisible()
    await chatInput.fill('Fixture AI question')
    await chatInput.press('Enter')
    await expect(page.getByText('Fixture AI question')).toBeVisible()
    await expect(page.getByText(LONG_AI_REPLY.slice(0, 70))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Читать полностью' })).toBeVisible()
    await page.getByRole('button', { name: 'Читать полностью' }).click()
    await expect(page.getByRole('button', { name: 'Свернуть ответ' })).toBeVisible()

    await page.getByRole('button', { name: 'Назад' }).click()
    await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
    // Первый Back закрывает conversation и оставляет fullscreen picker Mentor;
    // возврат на Today выполняется следующим шагом browser history.
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: /Утренний чек-ин/ })).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: /Утренний чек-ин/ })).toBeVisible()
    expect(fixtures.savedCheckins.filter(item => item.review_completed === true)).toHaveLength(1)

    const calendarDays = page.getByLabel('Календарь недели').locator('.mx-today-week-day')
    await expect(calendarDays).toHaveCount(7)

    await context.close()
  })
})
