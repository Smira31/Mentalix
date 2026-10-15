import { expect, test } from '@playwright/test'
import {
  backToToday,
  closeCheckin,
  closeStepButton,
  confirmCloseWithDraft,
  dayFocusOptionStep,
  edgeSwipeBack,
  nextStepButton,
  openDayCard,
  scaleStep,
} from './checkin-helpers.mjs'

/*
 * UX-аудит, пакет 1: навигация утреннего и вечернего чек-ина.
 *
 * Проверяет:
 *  — единое визуальное оформление продолжения (стрелка вперёд, галочка завершение);
 *  — круглую кнопку шага: без ответа «✕» (закрыть с черновиком), с ответом «→»;
 *  — отсутствие своих «назад»/«закрыть» в шапке: возврат — системная кнопка
 *    Telegram, в веб-превью — свайп от левого края (тот же обработчик);
 *  — сохранность введённого текста при выходе;
 *  — повторный вход восстанавливает черновик;
 *  — полностью стёртый текст не воскрешает старый черновик;
 *  — успешное сохранение не даёт крестику или отложенной записи
 *    создать черновик заново;
 *  — сбой API сохраняет текст в черновике.
 *
 * Даты — только относительно текущего дня (AGENTS.md): часы фиксируются
 * на «сегодня 08:00 / 19:00» локального времени. `clock.setFixedTime` меняет
 * только Date — таймеры дебаунса (500 мс) идут в реальном времени, поэтому
 * ожидание окна дебаунса построено на expect.poll, без waitForTimeout.
 */

const TEST_USER = {
  id: 900020,
  first_name: 'Nav QA',
  username: 'nav_qa_fixture',
}

/** Сегодняшний день в заданный локальный час. */
function todayAt(hour) {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return date
}

/** Локальный календарный ключ дня — тот же формат, что у toLocalCalendarDate. */
function localDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function morningDraftKey(userId = TEST_USER.id) {
  return `mx-checkin-draft-v1:${userId}:${localDayKey()}`
}

function eveningDraftKey(userId = TEST_USER.id) {
  return `mx-evening-draft-v1:${userId}:${localDayKey()}`
}

function jsonResponse(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

function buildFixtureRouter({ failFirstCheckin = false } = {}) {
  let checkin = null
  const savedCheckins = []
  let checkinPosts = 0

  return {
    savedCheckins,
    get checkinPosts() {
      return checkinPosts
    },
    async handle(route) {
      const request = route.request()
      const { pathname } = new URL(request.url())

      if (pathname === '/api/checkin' && request.method() === 'POST') {
        checkinPosts += 1

        if (failFirstCheckin && checkinPosts === 1) {
          return route.fulfill(jsonResponse({ detail: 'Ошибка сервера' }, 500))
        }

        const payload = request.postDataJSON()
        checkin = {
          id: 7020,
          date: localDayKey(),
          created_at: new Date().toISOString(),
          mood: payload.mood,
          energy: payload.energy,
          note: payload.note || null,
          review_completed_at: payload.review_completed ? new Date().toISOString() : null,
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
      // review_hour 0 — вечерняя карточка открыта в любое время: сценарий
      // проверяет навигацию чек-ина, а не гейт времени разбора.
      if (pathname === '/api/profile/settings') return route.fulfill(jsonResponse({ review_hour: 0 }))
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

async function openPage(browser, baseURL, fixtures, hour) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 393, height: 852 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await seedUser(context)
  await context.route('**/api/**', route => fixtures.handle(route))
  const page = await context.newPage()
  await page.clock.setFixedTime(todayAt(hour))
  await page.goto('/')
  return { context, page }
}

/** Утренний текстовый шаг: четыре шкалы и «Главный фокус дня» с выбором плитки. */
async function goToMorningNote(page) {
  for (let index = 0; index < 4; index += 1) {
    await scaleStep(page, 3)
  }
  await dayFocusOptionStep(page, 'Работа')
  await expect(page.locator('[data-testid="checkin-text-input"]')).toBeVisible()
}

/** Вечерний первый текстовый шаг: две шкалы и шаг эмоций. */
async function goToEveningLesson(page) {
  await scaleStep(page, 3)
  await scaleStep(page, 3)
  await page.locator('[data-testid="checkin-emotion-pill"][data-emotion="ровно"]').click()
  await page.locator('[data-testid="checkin-next"]').click()
  await expect(page.locator('[data-testid="checkin-text-input"]')).toBeVisible()
}

function readStorage(page, key) {
  return page.evaluate(storageKey => localStorage.getItem(storageKey), key)
}

/** Ожидание окна дебаунса (500 мс) без waitForTimeout: сначала ждём время, потом значение. */
async function expectStorageStays(page, key, expected, { afterMs = 800, timeout = 5000 } = {}) {
  const startedAt = Date.now()
  await expect
    .poll(
      async () => {
        const value = await readStorage(page, key)
        return Date.now() - startedAt >= afterMs ? value : '__waiting__'
      },
      { timeout, intervals: [150] }
    )
    .toBe(expected)
}

/*
 * Выход из шагов «Назад» (свайп от левого края — тот же обработчик, что у
 * системной кнопки Telegram): со второго и дальнейших шагов это шаг назад,
 * с первого — закрытие чек-ина с черновиком. Заголовки — то, что видно
 * после каждого шага: без них проверка не отличит возврат от закрытия.
 */
async function backOutOfMorning(page) {
  const headings = [
    'Главный фокус на сегодня?',
    'Уровень концентрации',
    'Сколько в тебе энергии?',
    'Как ты спал?',
    'Как ты сейчас?',
  ]

  for (const heading of headings) {
    await edgeSwipeBack(page)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }

  await edgeSwipeBack(page)
  await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()
}

/** Вечерний путь «Назад» до первого шага: урок → эмоция → энергия → настроение. */
async function backOutOfEvening(page) {
  await edgeSwipeBack(page)
  await expect(page.locator('[data-testid="checkin-emotion-pill"]').first()).toBeVisible()
  await edgeSwipeBack(page)
  await expect(page.getByRole('heading', { name: 'Сколько в тебе энергии?' })).toBeVisible()
  await edgeSwipeBack(page)
  await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
}

test.describe('Check-in navigation consistency (UX audit pack 1)', () => {
  test('morning: «Назад» идёт шаг за шагом, «✕» на шаге закрывает с черновиком, последнее действие — галочка', async ({
    browser,
    baseURL,
  }) => {
    const fixtures = buildFixtureRouter()
    const { context, page } = await openPage(browser, baseURL, fixtures, 8)

    // ── Шаг 0: своих «назад» и «закрыть» в шапке нет; без ответа круглая — «✕» ──
    await openDayCard(page, 'morning')
    await expect(page.locator('[data-testid="checkin-close"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="back-button"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
    await expect(closeStepButton(page)).toBeVisible()

    // ── Ответ выбран — та же круглая кнопка становится «→» ──
    await page.locator('[data-testid="checkin-scale-option"][data-level="4"]').click()
    await expect(nextStepButton(page)).toBeVisible()
    await nextStepButton(page).click()
    await expect(page.getByRole('heading', { name: 'Как ты спал?' })).toBeVisible()

    // ── «Назад» возвращает на предыдущий шаг, ответ сохраняется ──
    await edgeSwipeBack(page)
    await expect(page.getByRole('heading', { name: 'Как ты сейчас?' })).toBeVisible()
    await expect(page.locator('[data-testid="checkin-scale-option"][data-level="4"]')).toHaveAttribute(
      'aria-checked',
      'true'
    )
    await expect(nextStepButton(page)).toBeVisible()

    // ── Остальные шкалы, затем фокус дня: без плитки шаг вперёд не идёт ──
    await nextStepButton(page).click()
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await scaleStep(page, 3)
    await expect(page.getByRole('heading', { name: 'Главный фокус на сегодня?' })).toBeVisible()
    await expect(closeStepButton(page)).toBeVisible()
    await dayFocusOptionStep(page, 'Работа')

    // ── Текстовый шаг: последнее действие — галочка «Завершить», а не стрелка ──
    await expect(page.locator('[data-testid="checkin-complete"]')).toBeVisible()
    await expect(page.locator('[data-testid="checkin-complete"]')).toHaveAttribute(
      'aria-label',
      'Завершить'
    )
    // Галочка остаётся при пустом поле и активна: чек-ин завершается и без текста.
    await expect(page.locator('[data-testid="checkin-complete"]')).toBeEnabled()
    await expect(page.locator('[data-testid="checkin-next"]')).toHaveCount(0)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Draft note for exit test')

    // ── Выход «Назад» с последнего шага: шаг за шагом до первого, затем закрытие ──
    await backOutOfMorning(page)
    await expect.poll(() => readStorage(page, morningDraftKey())).not.toBeNull()

    // ── Повторный вход: черновик восстанавливается ──
    await openDayCard(page, 'morning')
    await goToMorningNote(page)

    await expect(page.locator('[data-testid="checkin-text-input"]')).toContainText(
      'Draft note for exit test'
    )

    await context.close()
  })

  test('morning: полностью стёртый текст не восстанавливается из старого черновика', async ({
    browser,
    baseURL,
  }) => {
    const fixtures = buildFixtureRouter()
    const { context, page } = await openPage(browser, baseURL, fixtures, 8)

    await openDayCard(page, 'morning')
    await goToMorningNote(page)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Текст, который сотрут')
    // Дебаунс черновика — 500 мс: сначала он записывает текст.
    await expect.poll(() => readStorage(page, morningDraftKey())).not.toBeNull()

    // Полностью стираем текст — старый черновик не должен остаться.
    await input.fill('')
    await expectStorageStays(page, morningDraftKey(), null)

    await backOutOfMorning(page)

    // Повторный вход: поле пустое, удалённый текст не воскрес.
    await openDayCard(page, 'morning')
    await goToMorningNote(page)
    await expect(page.locator('[data-testid="checkin-text-input"]')).toBeEmpty()

    await context.close()
  })

  test('evening: полностью стёртый урок не восстанавливается из старого черновика', async ({
    browser,
    baseURL,
  }) => {
    const fixtures = buildFixtureRouter()
    const { context, page } = await openPage(browser, baseURL, fixtures, 19)

    await openDayCard(page, 'evening')
    await goToEveningLesson(page)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Текст, который сотрут')
    // Дебаунс черновика — 500 мс: сначала он записывает текст.
    await expect.poll(() => readStorage(page, eveningDraftKey())).not.toBeNull()

    // Полностью стираем урок — старый черновик не должен остаться.
    await input.fill('')
    await expectStorageStays(page, eveningDraftKey(), null)

    // Пустой урок: круглая «✕» на шаге закрывает разбор без подтверждения.
    await closeCheckin(page)
    await expect(page.locator('[data-testid="today-card-evening"]')).toBeVisible()

    // Повторный вход: поле пустое, удалённый текст не воскрес.
    await openDayCard(page, 'evening')
    await goToEveningLesson(page)
    await expect(page.locator('[data-testid="checkin-text-input"]')).toBeEmpty()

    await context.close()
  })

  test('morning: успешное сохранение — крестик и отложенная запись не создают черновик заново', async ({
    browser,
    baseURL,
  }) => {
    const fixtures = buildFixtureRouter()
    const { context, page } = await openPage(browser, baseURL, fixtures, 8)

    await openDayCard(page, 'morning')
    await goToMorningNote(page)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Текст, который сохранится')

    // Завершаем сразу: отложенная запись (500 мс) ещё в очереди.
    await page.locator('[data-testid="checkin-complete"]').click()
    await expect(page.getByRole('heading', { name: /Ты прошёл утренний чек-ин/ })).toBeVisible()
    expect(fixtures.checkinPosts).toBe(1)

    // Выход с экрана завершения пилюлей «Сохранить и выйти»:
    // черновик не должен появиться.
    await backToToday(page)
    await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()

    // Отложенный таймер не возвращает черновик после сохранения.
    await expectStorageStays(page, morningDraftKey(), null)

    // Повторный вход открывает сохранённую запись, а не черновик.
    await openDayCard(page, 'morning')
    await expect(page.getByText('Текст, который сохранится')).toBeVisible()
    expect(await readStorage(page, morningDraftKey())).toBeNull()

    await context.close()
  })

  test('morning: сбой API сохраняет текст в черновике', async ({ browser, baseURL }) => {
    const fixtures = buildFixtureRouter({ failFirstCheckin: true })
    const { context, page } = await openPage(browser, baseURL, fixtures, 8)

    await openDayCard(page, 'morning')
    await goToMorningNote(page)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Текст при сбое')
    await page.locator('[data-testid="checkin-complete"]').click()

    await expect(page.getByRole('alert')).toHaveText('Не удалось сохранить. Попробуй ещё раз.')
    await expect(input).toContainText('Текст при сбое')
    expect(fixtures.checkinPosts).toBe(1)

    // Выход «Назад» после сбоя — текст остаётся на устройстве.
    await backOutOfMorning(page)
    await expect.poll(() => readStorage(page, morningDraftKey())).not.toBeNull()

    // Повторный вход восстанавливает написанное.
    await openDayCard(page, 'morning')
    await goToMorningNote(page)
    await expect(page.locator('[data-testid="checkin-text-input"]')).toContainText('Текст при сбое')

    await context.close()
  })

  test('evening: выход «Назад» с несохранённым уроком подтверждается, повторный вход возвращает текст урока', async ({
    browser,
    baseURL,
  }) => {
    const fixtures = buildFixtureRouter()
    const { context, page } = await openPage(browser, baseURL, fixtures, 19)

    await openDayCard(page, 'evening')
    await expect(page.locator('[data-testid="checkin-close"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="back-button"]')).toHaveCount(0)

    await goToEveningLesson(page)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Черновик вечернего урока')

    // В уроке есть текст — на шаге «→»; выходим «Назад» до первого шага,
    // где «Назад» закрывает разбор и просит подтверждение.
    await backOutOfEvening(page)
    await edgeSwipeBack(page)
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(page.getByText('Закрыть запись?')).toBeVisible()

    await confirmCloseWithDraft(page)
    await expect(page.locator('[data-testid="today-card-evening"]')).toBeVisible()
    await expect.poll(() => readStorage(page, eveningDraftKey())).not.toBeNull()

    // ── Повторный вход: черновик вечернего урока возвращается ──
    await openDayCard(page, 'evening')
    await goToEveningLesson(page)
    await expect(page.locator('[data-testid="checkin-text-input"]')).toContainText(
      'Черновик вечернего урока'
    )

    await context.close()
  })

  test('evening: успешное сохранение — крестик и отложенная запись не создают черновик заново', async ({
    browser,
    baseURL,
  }) => {
    const fixtures = buildFixtureRouter()
    const { context, page } = await openPage(browser, baseURL, fixtures, 19)

    await openDayCard(page, 'evening')
    await goToEveningLesson(page)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Фактический результат')
    await nextStepButton(page).click()
    await expect(input).toBeVisible()
    await input.fill('Что было трудно')
    await nextStepButton(page).click()
    await expect(input).toBeVisible()
    await input.fill('Вывод дня')
    // Завершаем сразу: отложенная запись (500 мс) ещё в очереди.
    await page.locator('[data-testid="checkin-next"]').click()

    await expect(page.getByRole('heading', { name: 'Ты завершил разбор дня.' })).toBeVisible()
    expect(fixtures.checkinPosts).toBe(1)

    // Выход с экрана завершения пилюлей «Сохранить и выйти»:
    // черновик не должен появиться.
    await backToToday(page)
    await expect(page.locator('[data-testid="today-card-evening"]')).toBeVisible()
    await expectStorageStays(page, eveningDraftKey(), null)

    await context.close()
  })

  test('evening: сбой API сохраняет текст урока в черновике', async ({ browser, baseURL }) => {
    const fixtures = buildFixtureRouter({ failFirstCheckin: true })
    const { context, page } = await openPage(browser, baseURL, fixtures, 19)

    await openDayCard(page, 'evening')
    await goToEveningLesson(page)

    const input = page.locator('[data-testid="checkin-text-input"]')
    await input.fill('Фактический результат')
    await nextStepButton(page).click()
    await expect(input).toBeVisible()
    await input.fill('Что было трудно')
    await nextStepButton(page).click()
    await expect(input).toBeVisible()
    await input.fill('Вывод дня')
    await page.locator('[data-testid="checkin-next"]').click()

    await expect(page.getByText('Не получилось сохранить — проверь связь')).toBeVisible()
    expect(fixtures.checkinPosts).toBe(1)

    // Сбой API не теряет текст: он остаётся на устройстве.
    await expect.poll(() => readStorage(page, eveningDraftKey())).not.toBeNull()

    await context.close()
  })
})
