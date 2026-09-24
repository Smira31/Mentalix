import { expect, test } from '@playwright/test'
import {
  moodPracticeStart,
  moodPracticeMoodStep,
  moodPracticeEmotionStep,
  moodPracticeContextStep,
  moodPracticeSkipBreathing,
  moodPracticeBreathe,
  moodPracticeDone,
  expectMoodPracticeError,
  expectMoodPracticeCompletion,
} from './checkin-helpers.mjs'

const TEST_USER = {
  id: 900020,
  first_name: 'Mood QA',
  username: 'mood_qa_fixture',
}

function jsonResponse(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

/**
 * Fixture-роутер для практики «Настроение».
 * saveAttempts — сколько раз POST /mood-practices уже обработан.
 * failFirst — если true, первый POST возвращает 500, последующие — 200.
 */
function buildMoodFixtureRouter({ failFirst = false } = {}) {
  const savedPractices = []
  let saveAttempts = 0

  return {
    savedPractices,
    async handle(route) {
      const request = route.request()
      const url = new URL(request.url())
      const { pathname } = url

      // POST /mood-practices — создание записи практики
      if (pathname === '/api/mood-practices' && request.method() === 'POST') {
        saveAttempts++
        if (failFirst && saveAttempts === 1) {
          return route.fulfill(jsonResponse({ detail: 'Internal error' }, 500))
        }
        const payload = request.postDataJSON()
        savedPractices.push(payload)
        return route.fulfill(jsonResponse({ id: 100 + saveAttempts, ...payload }))
      }

      // GET-эндпоинты
      if (request.method() !== 'GET') return route.fulfill(jsonResponse({ ok: true }))

      if (pathname === '/api/profile') return route.fulfill(jsonResponse(TEST_USER))
      if (pathname === '/api/rituals') {
        return route.fulfill(
          jsonResponse([{ id: 701, title: 'Fixture ritual', today_level: null }])
        )
      }
      if (pathname === '/api/ascezas') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/quotes/today') {
        return route.fulfill(jsonResponse({ text: 'Fixture quote.' }))
      }
      if (pathname === '/api/profile/settings') {
        return route.fulfill(jsonResponse({ review_hour: 24 }))
      }
      if (pathname === '/api/analytics/pulse') {
        return route.fulfill(jsonResponse({ active_today: 1 }))
      }
      if (pathname === '/api/analytics') {
        return route.fulfill(
          jsonResponse({ period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] })
        )
      }
      if (pathname === '/api/pinned-practices') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/articles') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/themes') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/mentalix/consent') {
        return route.fulfill(jsonResponse({ context_consent: false }))
      }
      if (pathname === '/api/mentalix/messages') {
        return route.fulfill(jsonResponse([]))
      }
      if (pathname === '/api/checkin/today') return route.fulfill(jsonResponse(null))
      if (pathname === '/api/checkin/history') return route.fulfill(jsonResponse([]))
      if (pathname === '/api/mood-practices') {
        return route.fulfill(jsonResponse([]))
      }
      if (pathname === '/api/events/log') return route.fulfill(jsonResponse({ ok: true }))

      return route.fulfill(jsonResponse({}))
    },
  }
}

async function seedUser(context) {
  await context.addInitScript(user => {
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
    localStorage.removeItem('mx-mood-practice-intro-seen')
  }, TEST_USER)
}

test.describe('Mood practice smoke', () => {
  test('полный проход: intro → mood → emotion → context → skip breathing → done', async ({
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
    const fixtures = buildMoodFixtureRouter()
    await seedUser(context)
    await context.route('**/api/**', route => fixtures.handle(route))
    const page = await context.newPage()

    await page.goto('/?tab=practices')

    // Открыть практику «Настроение» из каталога
    const moodCard = page.getByRole('button', { name: 'Открыть Настроение' })
    await expect(moodCard).toBeVisible()
    await moodCard.click()

    // ── Полный проход ──
    await moodPracticeStart(page)
    await moodPracticeMoodStep(page, 3)
    await moodPracticeEmotionStep(page, 'ровно')
    await moodPracticeContextStep(page, { note: 'Fixture note', context: 'work' })
    await moodPracticeSkipBreathing(page)

    // Экран завершения
    await expectMoodPracticeCompletion(page)

    // Проверяем, что запись сохранена с правильными данными
    expect(fixtures.savedPractices).toHaveLength(1)
    expect(fixtures.savedPractices[0].mood).toBe(3)
    expect(fixtures.savedPractices[0].emotion).toBe('ровно')
    expect(fixtures.savedPractices[0].context).toBe('work')
    expect(fixtures.savedPractices[0].note).toBe('Fixture note')
    expect(fixtures.savedPractices[0].breathing_completed).toBe(false)

    // Завершить
    await moodPracticeDone(page)

    await context.close()
  })

  test('ошибка сохранения → повтор: данные не теряются', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 393, height: 852 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    const fixtures = buildMoodFixtureRouter({ failFirst: true })
    await seedUser(context)
    await context.route('**/api/**', route => fixtures.handle(route))
    const page = await context.newPage()

    await page.goto('/?tab=practices')

    const moodCard = page.getByRole('button', { name: 'Открыть Настроение' })
    await expect(moodCard).toBeVisible()
    await moodCard.click()

    // ── Проход до шага дыхания ──
    await moodPracticeStart(page)
    await moodPracticeMoodStep(page, 4)
    await moodPracticeEmotionStep(page, 'спокойно')
    await moodPracticeContextStep(page, { note: 'Retry note', context: 'home' })

    // Первая попытка сохранения → ошибка
    await moodPracticeSkipBreathing(page)
    await expectMoodPracticeError(page)

    // Данные не потеряны — мы на шаге breathing, кнопки сохранения активны
    const skipBtn = page.locator('[data-testid="mood-practice-skip-breathing"]')
    await expect(skipBtn).toBeVisible()
    await expect(skipBtn).toBeEnabled()

    // Повторное сохранение → успех
    await skipBtn.click()
    await expectMoodPracticeCompletion(page)

    // Проверяем, что только одна успешная запись сохранена (первая не дошла)
    expect(fixtures.savedPractices).toHaveLength(1)
    expect(fixtures.savedPractices[0].mood).toBe(4)
    expect(fixtures.savedPractices[0].emotion).toBe('спокойно')
    expect(fixtures.savedPractices[0].context).toBe('home')
    expect(fixtures.savedPractices[0].note).toBe('Retry note')
    expect(fixtures.savedPractices[0].breathing_completed).toBe(false)

    await context.close()
  })

  test('полный проход с дыханием: breathing_completed = true', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 393, height: 852 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    const fixtures = buildMoodFixtureRouter()
    await seedUser(context)
    await context.route('**/api/**', route => fixtures.handle(route))
    const page = await context.newPage()

    await page.goto('/?tab=practices')

    const moodCard = page.getByRole('button', { name: 'Открыть Настроение' })
    await expect(moodCard).toBeVisible()
    await moodCard.click()

    await moodPracticeStart(page)
    await moodPracticeMoodStep(page, 5)
    await moodPracticeEmotionStep(page, 'радостно')
    await moodPracticeContextStep(page, {})
    await moodPracticeBreathe(page)

    await expectMoodPracticeCompletion(page)

    expect(fixtures.savedPractices).toHaveLength(1)
    expect(fixtures.savedPractices[0].breathing_completed).toBe(true)

    await context.close()
  })
})
