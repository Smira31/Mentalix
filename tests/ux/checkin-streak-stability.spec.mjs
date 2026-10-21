import { expect, test } from '@playwright/test'
import { dayFocusOptionStep, openDayCard, scaleStep } from './checkin-helpers.mjs'

/*
 * Стабильность экранов завершения чек-ина и серии (задача fix-checkin-layout).
 *
 * Владелец прислал видео с iPhone: при завершении утреннего чек-ина
 * интерфейс прыгает, а на экране «Серия 9 дней» стоял цветок, не из Mentalix.
 *
 * Что проверяется:
 *   1. Утренний чек-ин: клавиатура открыта в момент нажатия «Завершить»,
 *      финал появляется при открытой клавиатуре, затем она закрывается —
 *      иллюстрация, заголовок, дата и CTA не двигаются.
 *      Клавиатура имитируется подменой `visualViewport.height` при
 *      неизменном `window.innerHeight` — так ведёт себя iOS/Telegram.
 *   2. Вечерний финал: та же последовательность на экране завершения вечера.
 *   3. Переход «финал → серия»: у экранов общий шелл, поэтому нижний блок
 *      и главное действие обязаны стоять на одной высоте; клавиатура
 *      не растягивает и экран серии.
 *   4. Демо-ссылка ?demo=1&action=streak_celebration&streak_days=N показывает
 *      пятилистный цветок (1, 3 и 5 светлых лепестков) и огонёк тонким
 *      контуром без заливки; экран не требует скролла.
 *   5. Реальный переход «сохранение → оценка “Помогло?” → серия 9 дней»:
 *      API подменяется только внутри теста (до сохранения серия 8 и сегодня
 *      не активен, после — 9 и активен), а приложение проходит настоящий
 *      путь утреннего чек-ина. На обоих вьюпортах совпадают полосы героя,
 *      заголовка, нижнего блока и кнопки, клавиатура ничего не двигает,
 *      нет обрезки и лишней прокрутки.
 *
 * Вьюпорты задачи — 430×932 (iPhone 15 Pro Max) и 360×640.
 * Скриншоты: CHECKIN_STREAK_SHOTS (по умолчанию test-results/checkin-streak).
 */

const SHOTS = process.env.CHECKIN_STREAK_SHOTS || 'test-results/checkin-streak'
const VIEWPORTS = [
  { name: '430x932', width: 430, height: 932 },
  { name: '360x640', width: 360, height: 640 },
]

/** Прохождение утреннего чек-ина до текстового шага. */
async function passMorningSteps(page) {
  await openDayCard(page, 'morning')
  for (const level of [4, 3, 3, 3]) await scaleStep(page, level)
  await dayFocusOptionStep(page, 'Работа')
  await expect(page.getByTestId('checkin-text-input')).toBeVisible()
}

/** Текстовый шаг → экран завершения. */
async function finishMorningNote(page) {
  await page.getByTestId('checkin-text-input').fill('Проверка стабильности экрана')
  await page.getByTestId('checkin-complete').click()
  await expect(page.getByTestId('checkin-completion')).toBeVisible()
}

/*
 * Положение ключевых элементов финала в координатах вьюпорта.
 * Один и тот же набор читается на экране завершения и на экране серии,
 * поэтому проверка «ничего не сдвинулось» сравнивает одинаковые ключи.
 * shellHeight нужен отдельно: у стабильного экрана он равен layout-вьюпорту
 * (window.innerHeight) и не следует за visualViewport.
 */
async function readFinalLayout(page) {
  return page.evaluate(() => {
    /* Экран финала: либо завершение чек-ина, либо экран серии —
       у них разные корни, а ключи замера общие. */
    const screen =
      document.querySelector('.mx-streak-celebration') || document.querySelector('.mx-completion')
    const measure = el => {
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return { top: Math.round(rect.top), height: Math.round(rect.height) }
    }
    const box = selector => measure(screen?.querySelector(selector))
    /* Переполнение ближайшей прокручиваемой области вокруг экрана:
       у утреннего чек-ина это .mx-step-slide, у вечернего — оболочка. */
    const overflow = () => {
      if (!screen) return null
      /* Сначала прокрутка внутри экрана (экран серии), затем — вокруг него
         (утренний и вечерний чек-ин). Иначе переполнение экрана серии
         не измерялось вообще. */
      const candidates = [screen.querySelector('.mx-fullscreen-scroll')]
      for (let el = screen.parentElement; el; el = el.parentElement) candidates.push(el)
      for (const node of candidates) {
        if (node && /(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
          return Math.max(0, node.scrollHeight - node.clientHeight)
        }
      }
      return 0
    }
    // У утреннего демо-экрана шелл — .mx-demo-checkin, у остальных — fullscreen-поверхность.
    const shell = document.querySelector('.mx-fullscreen-surface, .mx-demo-checkin')
    return {
      shell: measure(shell),
      shellHeight: Math.round(shell?.getBoundingClientRect().height ?? 0),
      innerHeight: Math.round(window.innerHeight),
      visualHeight: Math.round(window.visualViewport?.height ?? window.innerHeight),
      hero: box('.mx-completion__art-wrap') || measure(screen?.querySelector('[data-testid="streak-petals"]')),
      title: box('.mx-completion__title') || box('.mx-streak-celebration__text'),
      meta: box('.mx-completion__date-pill') || box('.mx-streak-celebration__days'),
      cta: measure(document.querySelector('.mx-completion-action button')),
      overflow: overflow(),
    }
  })
}

/** Сдвиги ключевых элементов между двумя замерами. */
function layoutDeltas(before, after, keys = ['hero', 'title', 'meta', 'cta']) {
  const deltas = {}
  for (const key of keys) {
    if (!before[key] || !after[key]) {
      deltas[key] = null
      continue
    }
    deltas[key] = Math.abs(after[key].top - before[key].top)
  }
  return deltas
}

/*
 * Клавиатура iOS/Telegram уменьшает visualViewport, но не window.innerHeight.
 * Подменяем только высоту visualViewport и сообщаем об этом приложению
 * штатным событием resize.
 */
async function stubKeyboardViewport(page, keyboardHeight) {
  await page.evaluate(height => {
    const viewport = window.visualViewport
    const proto = Object.getPrototypeOf(viewport)
    if (!window.__mxVvRestore) {
      window.__mxVvRestore = {
        height: Object.getOwnPropertyDescriptor(proto, 'height'),
        offsetTop: Object.getOwnPropertyDescriptor(proto, 'offsetTop'),
      }
    }
    Object.defineProperty(viewport, 'height', {
      configurable: true,
      get: () => Math.round(window.innerHeight) - height,
    })
    Object.defineProperty(viewport, 'offsetTop', { configurable: true, get: () => 0 })
    viewport.dispatchEvent(new Event('resize'))
  }, keyboardHeight)
}

/** Возврат настоящих значений visualViewport (клавиатура закрыта). */
async function restoreViewport(page) {
  await page.evaluate(() => {
    const viewport = window.visualViewport
    const restore = window.__mxVvRestore
    if (!restore) return
    Object.defineProperty(viewport, 'height', restore.height)
    Object.defineProperty(viewport, 'offsetTop', restore.offsetTop)
    viewport.dispatchEvent(new Event('resize'))
  })
  // Ждём кадр с пересчитанной геометрией, а не время.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

/*
 * Стабильный шелл: высота от layout-вьюпорта, а не от visualViewport.
 * На экране завершения и на экране серии shell обязан совпадать с
 * window.innerHeight и при открытой, и при закрытой клавиатуре.
 */
function expectStableShell(layout, label) {
  expect(layout.shellHeight, `${label}: шелл занимает layout-вьюпорт`).toBeGreaterThan(0)
  expect(
    Math.abs(layout.shellHeight - layout.innerHeight),
    `${label}: шелл не следует за клавиатурой (${layout.shellHeight} vs ${layout.innerHeight})`
  ).toBeLessThanOrEqual(2)
}

for (const viewport of VIEWPORTS) {
  test(`утренний чек-ин: закрытие клавиатуры не двигает финал, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/?demo=1&frame=0')
    await passMorningSteps(page)

    // Клавиатура открыта в момент нажатия «Завершить» — как в видео владельца.
    await page.getByTestId('checkin-text-input').fill('Проверка стабильности экрана')
    await stubKeyboardViewport(page, 336)
    await page.getByTestId('checkin-complete').click()
    await expect(page.getByTestId('checkin-completion')).toBeVisible()

    const withKeyboard = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/morning-keyboard-open-${viewport.name}.png` })

    // Клавиатура закрылась — visualViewport вернулся к полной высоте.
    await restoreViewport(page)
    const closed = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/morning-keyboard-closed-${viewport.name}.png` })

    const deltas = layoutDeltas(withKeyboard, closed)
    console.log(`morning keyboard open→closed ${viewport.name}`, JSON.stringify(deltas))
    for (const [key, delta] of Object.entries(deltas)) {
      expect.soft(delta, `после закрытия клавиатуры сдвинулся ${key}`).toBeLessThanOrEqual(2)
    }

    // stable включён: шелл равен layout-вьюпорту даже при открытой клавиатуре.
    expectStableShell(withKeyboard, `утренний финал, клавиатура открыта, ${viewport.name}`)
    expectStableShell(closed, `утренний финал, клавиатура закрыта, ${viewport.name}`)
    expect(closed.cta, 'CTA финала виден').not.toBeNull()
    expect(closed.cta.top + closed.cta.height).toBeLessThanOrEqual(viewport.height + 1)
    expect(closed.overflow, 'финал утра не требует скролла').toBeLessThanOrEqual(1)
  })
}

for (const viewport of VIEWPORTS) {
  test(`вечерний чек-ин: закрытие клавиатуры не двигает финал, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/?demo=1&frame=0&action=complete_evening')

    await expect(page.getByTestId('checkin-completion')).toBeVisible()
    await expect(page.getByTestId('checkin-feedback-option')).toHaveCount(3)

    await stubKeyboardViewport(page, 336)
    const withKeyboard = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/evening-keyboard-open-${viewport.name}.png` })

    await restoreViewport(page)
    const closed = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/evening-keyboard-closed-${viewport.name}.png` })

    const deltas = layoutDeltas(withKeyboard, closed)
    console.log(`evening keyboard open→closed ${viewport.name}`, JSON.stringify(deltas))
    for (const [key, delta] of Object.entries(deltas)) {
      expect.soft(delta, `после закрытия клавиатуры сдвинулся ${key}`).toBeLessThanOrEqual(2)
    }

    expectStableShell(withKeyboard, `вечерний финал, клавиатура открыта, ${viewport.name}`)
    expectStableShell(closed, `вечерний финал, клавиатура закрыта, ${viewport.name}`)
    expect(closed.cta, 'CTA вечернего финала виден').not.toBeNull()
    expect(closed.cta.top + closed.cta.height).toBeLessThanOrEqual(viewport.height + 1)
    expect(closed.overflow, 'вечерний финал не требует скролла').toBeLessThanOrEqual(1)
  })
}

for (const viewport of VIEWPORTS) {
  test(`«Помогло?» и переход финал → серия не перемещают нижний блок и CTA, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/?demo=1&frame=0&today_state=checkinPending')
    await passMorningSteps(page)
    await finishMorningNote(page)

    const completion = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/final-completion-${viewport.name}.png` })

    // Оценка «Помогло?»: выбранная плитка не должна перестраивать экран.
    await page.locator('[data-testid="checkin-feedback-option"][data-value="yes"]').click()
    await expect(
      page.locator('[data-testid="checkin-feedback-option"][data-value="yes"]')
    ).toHaveAttribute('aria-pressed', 'true')
    const rated = await readFinalLayout(page)
    const ratedDeltas = layoutDeltas(completion, rated)
    console.log(`completion→rated ${viewport.name}`, JSON.stringify(ratedDeltas))
    for (const [key, delta] of Object.entries(ratedDeltas)) {
      expect.soft(delta, `после оценки «Помогло?» сдвинулся ${key}`).toBeLessThanOrEqual(2)
    }

    /*
     * Экран серии (тот же компонент и тот же стабильный шелл).
     * Демо-API не увеличивает серию при сохранении, поэтому автоматический
     * переход после «Сохранить и выйти» в демо не срабатывает — экран
     * открывается прямой демо-ссылкой в том же вьюпорте. Проверяется то,
     * что важно для перехода: общая геометрия нижнего блока и CTA.
     */
    await page.goto('/?demo=1&frame=0&action=streak_celebration&streak_days=9')
    await expect(page.getByTestId('streak-celebration')).toBeVisible()
    const streak = await readFinalLayout(page)
    await page.screenshot({ path: `${SHOTS}/streak-9days-${viewport.name}.png` })

    // Героя и заголовка в сравнении нет: у экранов разное содержание
    // (иллюстрация финала ↔ цветок, две строки ↔ четыре), поэтому верх
    // заголовка зависит от длины текста. Стоять на месте обязаны нижний
    // блок и главное действие — они и сравниваются.
    const streakDeltas = layoutDeltas(completion, streak, ['meta', 'cta'])
    console.log(`completion→streak ${viewport.name}`, JSON.stringify(streakDeltas))
    console.log(`positions ${viewport.name}`, JSON.stringify({ completion, streak }))
    expect.soft(streakDeltas.cta, 'кнопка финала и серии на одной высоте').toBeLessThanOrEqual(2)
    /*
     * Нижний блок серии (ряд дней) по вертикали не совпадает с плашкой даты
     * финала: у экранов разное содержание, и на 360×640 ряд дней стоит выше
     * кнопки на другую величину, чем плашка. Проверяется то, что обязано
     * выполняться на любом вьюпорте: блок целиком выше CTA и не обрезан.
     */
    expect.soft(streak.meta.top + streak.meta.height, 'ряд дней не заходит под кнопку').toBeLessThanOrEqual(
      streak.cta.top + 1
    )
    expect.soft(streak.overflow, 'экран серии не требует скролла').toBeLessThanOrEqual(1)
    expectStableShell(streak, `экран серии, ${viewport.name}`)

    // Клавиатура, закрывающаяся после финала, не растягивает и экран серии.
    await stubKeyboardViewport(page, 336)
    const streakKeyboard = await readFinalLayout(page)
    await restoreViewport(page)
    const streakClosed = await readFinalLayout(page)
    const streakKeyboardDeltas = layoutDeltas(streakKeyboard, streakClosed)
    console.log(`streak keyboard open→closed ${viewport.name}`, JSON.stringify(streakKeyboardDeltas))
    for (const [key, delta] of Object.entries(streakKeyboardDeltas)) {
      expect.soft(delta, `на экране серии сдвинулся ${key}`).toBeLessThanOrEqual(2)
    }
    expectStableShell(streakKeyboard, `экран серии, клавиатура открыта, ${viewport.name}`)
  })
}

for (const viewport of VIEWPORTS) {
  for (const days of [1, 3, 5]) {
    test(`цветок серии: ${days} светлых лепестков из пяти, ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(`/?demo=1&frame=0&action=streak_celebration&streak_days=${days}`)

      await expect(page.getByTestId('streak-celebration')).toBeVisible()

      // Символ серии — цветок из пяти отдельных лепестков с пустым центром.
      const flower = page.getByTestId('streak-petals')
      await expect(flower).toBeVisible()
      await expect(flower).toHaveAttribute('data-lit', String(days))
      // Росток не используется.
      await expect(page.locator('[data-testid*="sprout"]')).toHaveCount(0)

      const flowerStyle = await flower.evaluate(svg => {
        const petals = Array.from(svg.querySelectorAll('path'))
        const litCount = Number(svg.dataset.lit)
        const fills = petals.map(petal => getComputedStyle(petal).fill)
        return {
          petals: petals.length,
          litCount,
          centerParts: svg.querySelectorAll('circle, ellipse, line, rect').length,
          litFills: [...new Set(fills.slice(0, litCount))],
          dimFills: [...new Set(fills.slice(litCount))],
          // Незажжённые лепестки обязаны читаться контуром, иначе при одном
          // светлом лепестке цветок выглядит как одиночный росток.
          dimStrokes: [
            ...new Set(
              petals
                .slice(litCount)
                .map(petal => `${getComputedStyle(petal).stroke}|${getComputedStyle(petal).strokeWidth}`)
            ),
          ],
          gradients: svg.querySelectorAll('linearGradient, radialGradient, filter').length,
          emoji: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(svg.textContent || ''),
        }
      })
      expect(flowerStyle.petals, 'пять отдельных лепестков').toBe(5)
      expect(flowerStyle.litCount, `${days} дней — ${days} светлых лепестков`).toBe(days)
      expect(flowerStyle.centerParts, 'центр цветка пустой').toBe(0)
      expect(flowerStyle.litFills, 'светлые лепестки одного цвета').toHaveLength(1)
      if (days < 5) {
        // Пять из пяти — тёмных лепестков в круге не остаётся.
        expect(flowerStyle.dimFills, 'тёмные лепестки одного цвета').toHaveLength(1)
        expect(flowerStyle.litFills[0], 'светлый лепесток светлее тёмного').not.toBe(
          flowerStyle.dimFills[0]
        )
        expect(flowerStyle.dimStrokes, 'у тёмных лепестков один контур').toHaveLength(1)
        expect(flowerStyle.dimStrokes[0], 'тёмный лепесток виден контуром').not.toContain('none|')
      }
      expect(flowerStyle.gradients, 'без градиентов и теней').toBe(0)
      expect(flowerStyle.emoji, 'без emoji').toBe(false)

      // Огонёк сегодняшнего дня — тот же тонкий контур без заливки.
      const flame = page.getByTestId('streak-flame')
      await expect(flame).toBeVisible()
      const flameStyle = await flame.evaluate(svg => {
        const parts = Array.from(svg.querySelectorAll('path, circle, line'))
        return {
          fills: parts.map(part => getComputedStyle(part).fill),
          strokeWidth: Math.max(
            ...parts.map(part => parseFloat(getComputedStyle(part).strokeWidth))
          ),
        }
      })
      expect(flameStyle.fills.every(fill => fill === 'none'), 'у огонька нет заливки').toBe(true)
      expect(flameStyle.strokeWidth, 'огонёк тонкой линией').toBeLessThanOrEqual(3)

      // Главное действие видно сразу и не уехало за экран.
      const layout = await readFinalLayout(page)
      expect(layout.cta, 'CTA серии виден').not.toBeNull()
      expect(layout.cta.top + layout.cta.height).toBeLessThanOrEqual(viewport.height + 1)
      expect(layout.overflow, 'экран серии не требует скролла').toBeLessThanOrEqual(1)
      expectStableShell(layout, `экран серии ${days} дней, ${viewport.name}`)

      await page.screenshot({ path: `${SHOTS}/streak-${days}days-${viewport.name}.png` })
    })
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Раздел 5. Реальный переход «сохранение → оценка → серия 9 дней».
 *
 * API подменяется только внутри теста (page.route): пока чек-ин не сохранён,
 * GET /api/streak отвечает «серия 8, сегодня не активен»; после сохранения —
 * «серия 9, сегодня активен» и история с записями прошлых дней. Экран серии
 * открывается собственным условием приложения (shouldCelebrateStreak), а не
 * демо-ссылкой, поэтому проверяется настоящий переход.
 * ────────────────────────────────────────────────────────────────────────── */

const MOCK_USER = { id: 900001, first_name: 'UX', username: 'local_ux_check' }

const GRID_FIXTURES = {
  rituals: [],
  ascezas: [],
  quote: { text: 'Один спокойный шаг важнее идеального плана.' },
  themes: [],
  settings: { review_hour: 24 },
  pulse: { active_today: 12 },
  pinnedPractices: [],
  articles: [],
  analytics: { period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] },
  history: [{ date: '2026-10-20' }, { date: '2026-10-19' }],
}

function jsonResponse(body, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

/** Серия до сохранения — 8 и сегодня не активен; после — 9 и активен. */
function streakPayload(active) {
  return active
    ? {
        current_streak: 9,
        longest_streak: 9,
        total_active_days: 30,
        is_active_today: true,
        freeze_used_this_week: false,
        recoverable: false,
      }
    : {
        current_streak: 8,
        longest_streak: 8,
        total_active_days: 29,
        is_active_today: false,
        freeze_used_this_week: false,
        recoverable: false,
      }
}

function createApiMock() {
  const state = { saved: false, streakRequests: 0 }

  const handler = request => {
    const pathname = new URL(request.url()).pathname
    const method = request.method()

    if (method !== 'GET') {
      // Сохранение утреннего чек-ина переключает серию на 9 дней.
      if (method === 'POST' && pathname === '/api/checkin') state.saved = true
      return jsonResponse({ id: 501, ok: true })
    }

    if (pathname === '/api/profile') return jsonResponse(MOCK_USER)
    if (pathname === '/api/streak') {
      state.streakRequests += 1
      return jsonResponse(streakPayload(state.saved))
    }
    if (pathname === '/api/checkin/today') return jsonResponse(null)
    if (pathname === '/api/checkin/history') return jsonResponse(GRID_FIXTURES.history)
    if (pathname === '/api/rituals') return jsonResponse(GRID_FIXTURES.rituals)
    if (pathname === '/api/ascezas') return jsonResponse(GRID_FIXTURES.ascezas)
    if (pathname === '/api/quotes/today') return jsonResponse(GRID_FIXTURES.quote)
    if (pathname === '/api/themes') return jsonResponse(GRID_FIXTURES.themes)
    if (pathname === '/api/profile/settings') return jsonResponse(GRID_FIXTURES.settings)
    if (pathname === '/api/analytics/pulse') return jsonResponse(GRID_FIXTURES.pulse)
    if (pathname === '/api/pinned-practices') return jsonResponse(GRID_FIXTURES.pinnedPractices)
    if (pathname === '/api/articles') return jsonResponse(GRID_FIXTURES.articles)
    if (pathname === '/api/analytics') return jsonResponse(GRID_FIXTURES.analytics)
    if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
    if (pathname === '/api/mentalix/messages') return jsonResponse([])

    return jsonResponse({ error: `Нет fixture для ${method} ${pathname}` }, 501)
  }

  return { state, handler }
}

/*
 * Итоговое fullscreen-состояние от платформы. В браузере Telegram-контролов
 * нет, но приложение до подтверждения резервирует 56 px «на всякий случай»
 * и снимает запас по таймауту (MXL-FULLSCREEN-SURFACE-RACE-001). Если финал
 * открыть до таймаута, а серию после, экраны измеряются в разных состояниях
 * запаса. Сообщаем то же событие, что присылает Telegram: controls не
 * рисуются, отступ не нужен. Это настоящий путь SDK, а не подмена состояния.
 */
async function answerFullscreen(page, isFullscreen = false) {
  await page.evaluate(value => {
    window.Telegram?.WebView?.receiveEvent?.('fullscreen_changed', { is_fullscreen: value })
  }, isFullscreen)
}

/** Дождаться конца анимаций входа/перехода, не ожидая по времени. */
async function settle(page) {
  await page.evaluate(
    () =>
      new Promise(resolve => {
        const running = (document.getAnimations?.() || []).filter(a => a.playState === 'running')
        const done = () =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        if (!running.length) {
          done()
          return
        }
        Promise.race([
          Promise.all(running.map(animation => animation.finished.catch(() => {}))),
          new Promise(next => setTimeout(next, 1000)),
        ]).then(done)
      })
  )
}

/*
 * Общая сетка: полоса героя, полоса заголовка, нижний блок, его первая строка
 * (плашка даты ↔ ряд дней) и главная кнопка. Дополнительно — обрезка текста,
 * выход за шелл и переполнение прокручиваемой области.
 */
async function readGridLayout(page) {
  return page.evaluate(() => {
    const streakRoot = document.querySelector('.mx-streak-celebration')
    const screen =
      streakRoot?.querySelector('.mx-completion') || document.querySelector('.mx-completion')
    const measure = el => {
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
      }
    }
    const box = selector => measure(screen?.querySelector(selector))
    const shell = document.querySelector('.mx-fullscreen-surface, .mx-demo-checkin')
    const shellRect = shell?.getBoundingClientRect()
    const ctaButton = document.querySelector('.mx-completion-action button')
    const clipping = el => {
      if (!el || !shellRect) return null
      const rect = el.getBoundingClientRect()
      return {
        outsideShell: rect.top < shellRect.top - 1 || rect.bottom > shellRect.bottom + 1,
        textClipped: el.scrollHeight > el.clientHeight + 1,
      }
    }
    const overflow = () => {
      if (!screen) return null
      const candidates = [screen.querySelector('.mx-fullscreen-scroll')]
      for (let el = screen.parentElement; el; el = el.parentElement) candidates.push(el)
      for (const node of candidates) {
        if (node && /(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
          return Math.max(0, node.scrollHeight - node.clientHeight)
        }
      }
      return Math.max(0, screen.scrollHeight - screen.clientHeight)
    }

    return {
      shell: measure(shell),
      shellHeight: Math.round(shell?.getBoundingClientRect().height ?? 0),
      innerHeight: Math.round(window.innerHeight),
      visualHeight: Math.round(window.visualViewport?.height ?? window.innerHeight),
      hero: box('.mx-completion__art-wrap'),
      title: box('.mx-completion__title'),
      meta: box('.mx-completion__meta'),
      row: box('.mx-completion__date-pill') || box('.mx-streak-celebration__days'),
      cta: measure(ctaButton),
      overflow: overflow(),
      titleClip: clipping(screen?.querySelector('.mx-completion__title')),
      metaClip: clipping(screen?.querySelector('.mx-completion__meta')),
      ctaClip: clipping(ctaButton),
      shellPaddingTop: shell ? getComputedStyle(shell).paddingTop : null,
      streakDays: screen?.querySelectorAll('.mx-streak-celebration__days li').length ?? 0,
    }
  })
}

/** Полосы сетки совпадают по вертикали и высоте (допуск ±2 px). */
function expectSameGridBand(before, after, label, keys) {
  for (const key of keys) {
    expect(before[key], `${label}: полоса ${key} до перехода`).not.toBeNull()
    expect(after[key], `${label}: полоса ${key} после перехода`).not.toBeNull()
    expect(
      Math.abs(after[key].top - before[key].top),
      `${label}: ${key} сместился по вертикали (${before[key].top} → ${after[key].top})`
    ).toBeLessThanOrEqual(2)
    expect(
      Math.abs(after[key].height - before[key].height),
      `${label}: ${key} изменил высоту (${before[key].height} → ${after[key].height})`
    ).toBeLessThanOrEqual(2)
  }
}

for (const viewport of VIEWPORTS) {
  test(`сохранение → оценка → серия 9 дней: общая сетка без сдвигов, ${viewport.name}`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const mock = createApiMock()

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.addInitScript(user => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('mentalix_web_user', JSON.stringify(user))
      localStorage.setItem('mx-onboarded-v2', '1')
      localStorage.setItem('mx-app-lock-enabled', '0')
    }, MOCK_USER)
    await page.route('**/api/**', route => route.fulfill(mock.handler(route.request())))
    await page.clock.setFixedTime('2026-10-21T08:00:00+03:00')

    // 1: утренний чек-ин до текстового шага, клавиатура открыта при «Завершить».
    await page.goto('/')
    await openDayCard(page, 'morning')
    // Пока идёт переговор о fullscreen, сообщаем итоговое состояние платформы:
    // иначе запас 56 px истекает по таймауту между финалом и серией.
    await answerFullscreen(page)
    for (const level of [4, 3, 3, 3]) await scaleStep(page, level)
    await dayFocusOptionStep(page, 'Работа')
    await expect(page.getByTestId('checkin-text-input')).toBeVisible()
    await page.getByTestId('checkin-text-input').fill('Проверка общей сетки финала')
    await stubKeyboardViewport(page, 336)
    await page.getByTestId('checkin-complete').click()
    await expect(page.getByTestId('checkin-completion')).toBeVisible()
    await settle(page)
    const withKeyboard = await readGridLayout(page)
    await page.screenshot({ path: `${SHOTS}/grid-completion-keyboard-${viewport.name}.png` })

    // 2: клавиатура закрылась — ни одна полоса сетки не сдвинулась.
    await restoreViewport(page)
    await settle(page)
    const completion = await readGridLayout(page)
    await page.screenshot({ path: `${SHOTS}/grid-completion-${viewport.name}.png` })
    console.log(`grid completion ${viewport.name}`, JSON.stringify(completion))
    expectSameGridBand(withKeyboard, completion, `закрытие клавиатуры, ${viewport.name}`, [
      'hero',
      'title',
      'meta',
      'cta',
    ])
    expect(Math.abs(withKeyboard.row.top - completion.row.top)).toBeLessThanOrEqual(2)
    expectStableShell(completion, `финал с серией 9, ${viewport.name}`)
    // Серия из API дошла до экрана финала.
    await expect(page.getByTestId('checkin-streak')).toHaveText('9-дневная серия')

    // 3: оценка «Помогло?» — выбранная плитка не перестраивает экран.
    await page.locator('[data-testid="checkin-feedback-option"][data-value="yes"]').click()
    await expect(
      page.locator('[data-testid="checkin-feedback-option"][data-value="yes"]')
    ).toHaveAttribute('aria-pressed', 'true')
    await settle(page)
    const rated = await readGridLayout(page)
    await page.screenshot({ path: `${SHOTS}/grid-rated-${viewport.name}.png` })
    expectSameGridBand(completion, rated, `оценка «Помогло?», ${viewport.name}`, [
      'hero',
      'title',
      'meta',
      'cta',
    ])
    expect(Math.abs(completion.row.top - rated.row.top)).toBeLessThanOrEqual(2)

    // 4: «Сохранить и выйти» → настоящий экран серии 9 дней.
    await page.getByTestId('checkin-back-to-today').click()
    await expect(page.getByTestId('streak-celebration')).toBeVisible()
    await expect(page.getByTestId('streak-celebration-text')).toContainText('Серия 9 дней.')
    await settle(page)
    const streak = await readGridLayout(page)
    await page.screenshot({ path: `${SHOTS}/grid-streak-9days-${viewport.name}.png` })
    console.log(`grid streak ${viewport.name}`, JSON.stringify(streak))

    expect(mock.state.saved, 'чек-ин сохранён через API').toBe(true)
    // Цветок серии: 9 дней = 4 светлых лепестка в текущем круге из пяти.
    await expect(page.getByTestId('streak-petals')).toHaveAttribute('data-lit', '4')
    await expect(page.locator('.mx-streak-celebration__days li')).toHaveCount(3)
    expect(streak.streakDays, 'ряд из трёх дней').toBe(3)

    // 5: общая сетка двух экранов — герой, заголовок, нижний блок и кнопка.
    expect(streak.shellPaddingTop, 'верхний отступ шелла не изменился').toBe(
      rated.shellPaddingTop
    )
    expectSameGridBand(rated, streak, `финал → серия, ${viewport.name}`, [
      'hero',
      'title',
      'meta',
      'cta',
    ])
    expect(
      Math.abs(rated.row.top - streak.row.top),
      `финал → серия, ${viewport.name}: первая строка нижнего блока (${rated.row.top} → ${streak.row.top})`
    ).toBeLessThanOrEqual(2)

    // 6: нет обрезки и лишней прокрутки, кнопка целиком в экране.
    for (const [key, clip] of Object.entries({
      title: streak.titleClip,
      meta: streak.metaClip,
      cta: streak.ctaClip,
    })) {
      expect(clip.textClipped, `${key} не обрезан текстом на экране серии`).toBe(false)
      expect(clip.outsideShell, `${key} целиком внутри шелла на экране серии`).toBe(false)
    }
    expect(streak.cta.bottom, 'кнопка серии видна вся').toBeLessThanOrEqual(viewport.height + 1)
    expect(streak.overflow, 'экран серии не требует прокрутки').toBeLessThanOrEqual(1)
    expect(streak.meta.bottom, 'ряд дней выше кнопки').toBeLessThanOrEqual(streak.cta.top + 1)

    // 7: клавиатура, закрывающаяся уже на экране серии, ничего не двигает.
    await stubKeyboardViewport(page, 336)
    await settle(page)
    const streakKeyboard = await readGridLayout(page)
    await restoreViewport(page)
    await settle(page)
    const streakClosed = await readGridLayout(page)
    expectSameGridBand(streakKeyboard, streakClosed, `серия: закрытие клавиатуры, ${viewport.name}`, [
      'hero',
      'title',
      'meta',
      'cta',
    ])
    expectStableShell(streakKeyboard, `серия, клавиатура открыта, ${viewport.name}`)
    expectStableShell(streakClosed, `серия, клавиатура закрыта, ${viewport.name}`)
  })
}
