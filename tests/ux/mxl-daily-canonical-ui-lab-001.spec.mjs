import { expect, test } from '@playwright/test'

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

const FIRST_STEP = '10 минут разобрать макет'

for (const viewport of VIEWPORTS) {
  test(`daily canonical flow ${viewport.name} доносит First Step без изменений через весь день`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    const apiRequests = []
    page.on('request', request => {
      if (request.url().includes('/api/')) apiRequests.push(request.url())
    })

    await page.goto('/?ui_lab=daily-canonical')

    const experiment = page.locator('.mx-daily')
    await expect(experiment).toBeVisible()
    await expect(experiment).toHaveAttribute('data-phase', 'welcome')
    await expect(page.locator('body')).toHaveCSS('overflow-x', 'hidden')

    const noHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
    expect(noHorizontalOverflow).toBe(true)

    // Welcome -> Today/checkinPending
    await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'checkinPending')

    // Today/checkinPending -> Morning Check-in
    await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'morningCheckin')

    for (const metric of ['Настроение', 'Энергия', 'Шум в голове', 'Фокус / собранность']) {
      await page.getByRole('radio', { name: `${metric}: 3 из 5` }).click()
    }
    await page.getByRole('button', { name: 'Дальше' }).click()

    await page.getByRole('radio', { name: 'Разобраться с важным' }).click()
    await page.getByRole('button', { name: 'Выбрать шаг' }).click()

    await page.getByRole('textbox', { name: 'Первый шаг' }).fill(FIRST_STEP)
    await page.getByRole('button', { name: 'Начать день' }).click()

    await expect(page.getByRole('definition').filter({ hasText: FIRST_STEP })).toBeVisible()
    await page.getByRole('button', { name: 'Подтвердить' }).click()

    // Morning Check-in -> Today/dayInProgress, First Step дословно
    await expect(experiment).toHaveAttribute('data-phase', 'dayInProgress')
    await expect(experiment.locator('[data-state="dayInProgress"]')).toContainText(FIRST_STEP)

    // dayInProgress -> completion
    await experiment.getByRole('button', { name: 'Отметить выполненным' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'completion')

    // completion -> Today/reviewPending, First Step всё ещё дословно
    await experiment.getByRole('button', { name: 'К вечернему разбору' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'reviewPending')
    await expect(experiment.locator('[data-state="reviewPending"]')).toContainText(FIRST_STEP)

    // Today.jsx рисует свою собственную кнопку «Разобрать день» на reviewPending
    // (ведёт в реальный CheckIn.jsx) рядом с нашей bridge-кнопкой (ведёт в
    // EveningReviewExperiment) — она спрятана CSS-таргетингом
    // (DailyCanonicalExperiment.css, [data-state='reviewPending'] .mx-today-primary-card
    // .cta-pill). Проверяем не по тексту одной кнопки, а что видимая/кликабельная
    // «Разобрать день» на экране ровно одна — иначе вернулся риск попасть в CheckIn.jsx.
    const reviewButtons = experiment.getByRole('button', { name: 'Разобрать день' })
    await expect(reviewButtons).toHaveCount(1)
    await expect(reviewButtons).toBeVisible()
    await expect(reviewButtons).toBeEnabled()

    // reviewPending -> Evening Review
    await reviewButtons.click()
    await expect(experiment).toHaveAttribute('data-phase', 'eveningReview')

    await page.getByRole('button', { name: 'Разобрать день', exact: true }).click()
    await page.getByRole('radio', { name: 'Сделал главное' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('radio', { name: 'Ясность' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('radio', { name: 'Маленький шаг помогает' }).click()
    await page.getByRole('button', { name: 'Дальше' }).click()
    await page.getByRole('radio', { name: 'Начать с пяти минут' }).click()
    await page.getByRole('button', { name: 'Закрыть день' }).click()

    await expect(page.getByText('День закрыт')).toBeVisible()
    await page.getByRole('button', { name: 'Продолжить' }).click()

    // Evening Review -> Today/dayClosed. Continuity уже доказана на dayInProgress и
    // reviewPending выше через hero ("Следующее действие: ...") — это time-independent
    // путь. На dayClosed сам hero ("День закрыт") текст ритуала не повторяет; единственное
    // место, где он мог бы всё ещё быть виден, — MorningPilotCard ("До других дел"), а тот
    // показывается только в реальном окне 5:00–11:59 (src/lib/morningPilot.js,
    // isMorningPilotTime) — это настоящее prod-поведение, не то, что мы построили, и
    // тест не должен зависеть от времени суток запуска.
    await expect(experiment).toHaveAttribute('data-phase', 'dayClosed')
    await expect(experiment.locator('[data-state="dayClosed"]')).toContainText('День закрыт')

    // Day Closed -> Next Day -> назад к Welcome
    await experiment.getByRole('button', { name: 'Следующий день' }).click()
    await expect(experiment).toHaveAttribute('data-phase', 'welcome')

    expect(apiRequests).toEqual([])
  })
}

test('daily canonical debug controls прыгают напрямую в каждое состояние без падений', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?ui_lab=daily-canonical')

  const experiment = page.locator('.mx-daily')

  for (const [label, phase] of [
    ['CHECKIN PENDING', 'checkinPending'],
    ['DAY IN PROGRESS', 'dayInProgress'],
    ['REVIEW PENDING', 'reviewPending'],
    ['DAY CLOSED', 'dayClosed'],
    ['NEW USER', 'welcome'],
  ]) {
    await experiment.getByRole('button', { name: label, exact: true }).click()
    await expect(experiment).toHaveAttribute('data-phase', phase)
  }

  await experiment.getByRole('button', { name: 'RESET' }).click()
  await expect(experiment).toHaveAttribute('data-phase', 'welcome')
})

// Edge case 1 — Back/Exit из Morning Check-in.
//
// MorningCheckinExperiment.jsx получил опциональный проп onExit (по тому же паттерну,
// что onComplete/onDayClosed): "Выйти" и "Назад" с первого шага (где отступать
// внутри компонента больше некуда) теперь зовут onExit, если он передан, вместо
// внутреннего reset(). DailyCanonicalExperiment прокидывает
// onExit={() => setPhase('checkinPending')} — Exit реально возвращает пользователя на
// Today/checkinPending, оверлей Morning Check-in закрывается (компонент размонтируется,
// т.к. рендерится только при phase === 'morningCheckin'). Без onExit (гипотетическое
// будущее использование компонента отдельно, вне этого флоу) старое поведение —
// internal reset — сохраняется, ничего не сломано для других потребителей.
//
// "Назад" с более позднего шага (Main, Step, Result) по-прежнему обычный шаг
// wizard'а назад — не Exit, значения не очищаются, phase не меняется.
test('daily canonical Morning Check-in Exit — реально возвращает на Today/checkinPending', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?ui_lab=daily-canonical')

  const experiment = page.locator('.mx-daily')
  await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
  await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()
  await expect(experiment).toHaveAttribute('data-phase', 'morningCheckin')

  // частично заполняем: 2 из 4 шкал
  await page.getByRole('radio', { name: 'Настроение: 3 из 5' }).click()
  await page.getByRole('radio', { name: 'Энергия: 4 из 5' }).click()

  // Exit с первого шага
  await page.getByRole('button', { name: 'Выйти из чек-ина' }).click()

  await expect(experiment).toHaveAttribute('data-phase', 'checkinPending')
  await expect(page.locator('.mx-morning__overlay')).toHaveCount(0)
  await expect(experiment.getByRole('button', { name: 'Начать чек-ин' })).toBeVisible()

  // Повторный вход начинается с чистого листа (компонент размонтировался — не
  // потому что где-то остался internal reset, а потому что React убрал его из дерева)
  await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()
  await expect(page.getByRole('radio', { name: 'Настроение: 3 из 5' })).toHaveAttribute(
    'aria-checked',
    'false'
  )

  // Exit с более позднего шага (Main, 2/3) — тоже возвращает на checkinPending
  for (const metric of ['Настроение', 'Энергия', 'Шум в голове', 'Фокус / собранность']) {
    await page.getByRole('radio', { name: `${metric}: 3 из 5` }).click()
  }
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByText('Главное · 2 / 3')).toBeVisible()

  await page.getByRole('button', { name: 'Выйти из чек-ина' }).click()
  await expect(experiment).toHaveAttribute('data-phase', 'checkinPending')
  await expect(page.locator('.mx-morning__overlay')).toHaveCount(0)
})

test('daily canonical Morning Check-in Back с более позднего шага остаётся wizard-шагом назад, не Exit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?ui_lab=daily-canonical')

  const experiment = page.locator('.mx-daily')
  await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
  await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()

  for (const metric of ['Настроение', 'Энергия', 'Шум в голове', 'Фокус / собранность']) {
    await page.getByRole('radio', { name: `${metric}: 3 из 5` }).click()
  }
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByText('Главное · 2 / 3')).toBeVisible()

  await page.getByRole('button', { name: 'Назад' }).click()

  // Back с шага 2 — обычный шаг wizard'а назад: остаёмся внутри Morning Check-in,
  // значения сохранены, это не Exit
  await expect(experiment).toHaveAttribute('data-phase', 'morningCheckin')
  await expect(page.getByText('Состояние · 1 / 3')).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Настроение: 3 из 5' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
})

// Edge case 2 — reload на середине флоу (Main Thing, шаг 2/3).
//
// DailyCanonicalExperiment не персистит состояние (ни localStorage, ни sessionStorage,
// ни URL) — это чистый local useState. Ожидаемое и единственно возможное поведение
// полного page.reload(): свежий React-маунт с initial state 'welcome'. Тест фиксирует,
// что это происходит без белого экрана и без НОВЫХ console errors/pageerror (фоновый
// шум Telegram SDK-шима 'CloudStorage is not supported' — известная, не связанная с
// этой веткой особенность web-режима, отфильтрована явно, а не скрыта молча).
test('daily canonical reload на Main Thing (2/3) — чистый сброс на welcome, без белого экрана и новых ошибок', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', err => consoleErrors.push(String(err)))

  await page.goto('/?ui_lab=daily-canonical')
  const experiment = page.locator('.mx-daily')

  await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
  await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()
  for (const metric of ['Настроение', 'Энергия', 'Шум в голове', 'Фокус / собранность']) {
    await page.getByRole('radio', { name: `${metric}: 3 из 5` }).click()
  }
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect(page.getByText('Главное · 2 / 3')).toBeVisible()

  consoleErrors.length = 0 // baseline сразу перед reload — интересуют только НОВЫЕ ошибки
  await page.reload()

  await expect(experiment).toBeVisible()
  await expect(experiment).toHaveAttribute('data-phase', 'welcome')
  await expect(
    page.getByRole('heading', { name: 'Понять, что важно. Сделать следующий шаг.' })
  ).toBeVisible()

  const KNOWN_TELEGRAM_SDK_NOISE = 'CloudStorage is not supported'
  const relevantErrors = consoleErrors.filter(e => !e.includes(KNOWN_TELEGRAM_SDK_NOISE))
  expect(relevantErrors).toEqual([])
})

// Edge case 3 — keyboard-навигация Welcome → ... → dayInProgress, только Tab/Enter/Space.
async function tabUntilFocused(page, matchText, { maxTabs = 120 } = {}) {
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press('Tab')
    const matched = await page.evaluate(text => {
      const el = document.activeElement
      if (!el || el === document.body) return false
      // textarea/input can carry их accessible name через оборачивающий <label>,
      // а не через aria-label/textContent самого поля (el.labels — стандартный DOM API).
      const labelsText = 'labels' in el ? Array.from(el.labels || []).map(l => l.textContent).join(' ') : ''
      const label = (el.getAttribute('aria-label') || el.textContent || labelsText || '').trim()
      return label.includes(text)
    }, matchText)
    if (matched) return true
  }
  return false
}

test('daily canonical keyboard-only флоу Welcome → dayInProgress, без единого клика мышью', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?ui_lab=daily-canonical')

  const experiment = page.locator('.mx-daily')

  // Welcome -> checkinPending, чисто клавиатурой
  expect(await tabUntilFocused(page, 'Начать')).toBe(true)
  await expect(page.locator(':focus')).toHaveCSS('outline-style', 'solid') // focus-visible виден (глобальный button:focus-visible из index.css)
  await page.keyboard.press('Enter')
  await expect(experiment).toHaveAttribute('data-phase', 'checkinPending')

  // checkinPending -> открыть Morning Check-in
  expect(await tabUntilFocused(page, 'Начать чек-ин')).toBe(true)
  await page.keyboard.press('Enter')
  await expect(experiment).toHaveAttribute('data-phase', 'morningCheckin')

  // "Дальше" недоступен клавиатуре, пока форма не заполнена — disabled-кнопка не фокусируется
  await expect(page.getByRole('button', { name: 'Дальше' })).toBeDisabled()

  for (const metric of ['Настроение', 'Энергия', 'Шум в голове', 'Фокус / собранность']) {
    expect(await tabUntilFocused(page, `${metric}: 3 из 5`)).toBe(true)
    await page.keyboard.press('Space')
  }

  // теперь "Дальше" реально включена и достижима табом
  await expect(page.getByRole('button', { name: 'Дальше' })).toBeEnabled()
  expect(await tabUntilFocused(page, 'Дальше')).toBe(true)
  await page.keyboard.press('Enter')
  await expect(page.getByText('Главное · 2 / 3')).toBeVisible()

  // "Выбрать шаг" недоступна, пока не выбран вариант
  await expect(page.getByRole('button', { name: 'Выбрать шаг' })).toBeDisabled()
  expect(await tabUntilFocused(page, 'Разобраться с важным')).toBe(true)
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Выбрать шаг' })).toBeEnabled()
  expect(await tabUntilFocused(page, 'Выбрать шаг')).toBe(true)
  await page.keyboard.press('Enter')
  await expect(page.getByText('Первый шаг · 3 / 3')).toBeVisible()

  // печатаем First Step клавиатурой
  expect(await tabUntilFocused(page, 'Первый шаг')).toBe(true)
  await page.keyboard.type(FIRST_STEP)
  await expect(page.getByRole('button', { name: 'Начать день' })).toBeEnabled()
  expect(await tabUntilFocused(page, 'Начать день')).toBe(true)
  await page.keyboard.press('Enter')

  await expect(page.getByRole('definition').filter({ hasText: FIRST_STEP })).toBeVisible()
  expect(await tabUntilFocused(page, 'Подтвердить')).toBe(true)
  await page.keyboard.press('Enter')

  await expect(experiment).toHaveAttribute('data-phase', 'dayInProgress')
  await expect(experiment.locator('[data-state="dayInProgress"]')).toContainText(FIRST_STEP)
})

// Edge case 4 — prefers-reduced-motion: reduce.
//
// DailyCanonicalExperiment переключает фазы простым condition-рендером без CSS-перехода
// на контейнере (нет fade/slide между фазами) — анимировать там нечего, поэтому
// reduced-motion физически не может что-то сломать на уровне переключения фаз.
// Единственные transition/transform в новых и переиспользуемых файлах (кнопки :active,
// прогресс-бар шагов) уже обёрнуты в @media (prefers-reduced-motion: reduce) и до этой
// сессии, и в новых DailyCanonicalExperiment.css/MorningCheckinExperiment.css. Тест
// прогоняет весь флоу с эмуляцией reduced-motion и проверяет, что в любой момент виден
// ровно один экран (нет одновременно двух перекрывающихся overlay/фаз) и нет console errors.
test('daily canonical reduced motion — весь флоу без перекрытий и ошибок', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('CloudStorage is not supported')) {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto('/?ui_lab=daily-canonical')
  const experiment = page.locator('.mx-daily')

  async function assertSingleVisibleOverlayOrPhase() {
    const overlays = page.locator('.mx-morning__overlay, .mx-evening-review__overlay')
    const visibleOverlayCount = await overlays.evaluateAll(
      els => els.filter(el => el.getClientRects().length > 0).length
    )
    expect(visibleOverlayCount).toBeLessThanOrEqual(1)
  }

  await experiment.getByRole('button', { name: 'Начать', exact: true }).click()
  await experiment.getByRole('button', { name: 'Начать чек-ин' }).click()
  await assertSingleVisibleOverlayOrPhase()

  for (const metric of ['Настроение', 'Энергия', 'Шум в голове', 'Фокус / собранность']) {
    await page.getByRole('radio', { name: `${metric}: 3 из 5` }).click()
  }
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('radio', { name: 'Разобраться с важным' }).click()
  await page.getByRole('button', { name: 'Выбрать шаг' }).click()
  await page.getByRole('textbox', { name: 'Первый шаг' }).fill(FIRST_STEP)
  await page.getByRole('button', { name: 'Начать день' }).click()
  await page.getByRole('button', { name: 'Подтвердить' }).click()
  await expect(experiment).toHaveAttribute('data-phase', 'dayInProgress')
  await assertSingleVisibleOverlayOrPhase()

  await experiment.getByRole('button', { name: 'Отметить выполненным' }).click()
  await experiment.getByRole('button', { name: 'К вечернему разбору' }).click()
  await experiment.locator('.mx-daily__bridge').getByText('Разобрать день').click()
  await expect(experiment).toHaveAttribute('data-phase', 'eveningReview')
  await assertSingleVisibleOverlayOrPhase()

  await page.getByRole('button', { name: 'Разобрать день', exact: true }).click()
  await page.getByRole('radio', { name: 'Сделал главное' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('radio', { name: 'Ясность' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('radio', { name: 'Маленький шаг помогает' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('radio', { name: 'Начать с пяти минут' }).click()
  await page.getByRole('button', { name: 'Закрыть день' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(experiment).toHaveAttribute('data-phase', 'dayClosed')
  await assertSingleVisibleOverlayOrPhase()

  expect(consoleErrors).toEqual([])
})
