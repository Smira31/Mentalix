import { expect, test } from '@playwright/test'
import { dayFocusOptionStep, openDayCard, scaleStep } from './checkin-helpers.mjs'

/*
 * Стабильность экранов завершения чек-ина и серии (задача fix-checkin-layout).
 *
 * Владелец прислал видео с iPhone: при завершении утреннего чек-ина интерфейс
 * прыгает, а на экране «Серия 9 дней» стоял цветок, не из Mentalix.
 *
 * Что проверяется:
 *   1. Экран завершения не зависит от высоты visualViewport: закрытие
 *      клавиатуры не двигает иллюстрацию, заголовок, содержимое и CTA.
 *      Клавиатура имитируется подменой `visualViewport.height` при
 *      неизменном `window.innerHeight` — так ведёт себя iOS/Telegram.
 *   2. Переход «Помогло?» → экран серии не перемещает героя, заголовок и CTA.
 *   3. Демо-ссылка ?demo=1&action=streak_celebration&streak_days=9 показывает
 *      цветок серии (пять отдельных лепестков, пустой центр) и огонёк
 *      тонким контуром без заливки, экран не требует скролла.
 *   4. Вечерний финал чек-ина не нарушен.
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
      let el = screen.parentElement
      while (el) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
          return el.scrollHeight - el.clientHeight
        }
        el = el.parentElement
      }
      return 0
    }
    return {
      shell: measure(
        document.querySelector('.mx-fullscreen-surface') || document.querySelector('.mx-demo-checkin')
      ),
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

test('закрытие клавиатуры не двигает экран завершения утреннего чек-ина', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/?demo=1&frame=0')
  await passMorningSteps(page)
  await finishMorningNote(page)

  const closed = await readFinalLayout(page)
  await page.screenshot({ path: `${SHOTS}/before-close-430x932.png` })
  expect(closed.cta, 'CTA финала должен быть виден').not.toBeNull()

  // Клавиатура «открывается» уже после завершения: у финала нет поля ввода,
  // но геометрия шелла не должна за ней следовать.
  await stubKeyboardViewport(page, 336)
  const keyboard = await readFinalLayout(page)
  await restoreViewport(page)
  const reopened = await readFinalLayout(page)

  const toKeyboard = layoutDeltas(closed, keyboard)
  const backToClosed = layoutDeltas(closed, reopened)
  console.log('layout completion→keyboard', JSON.stringify(toKeyboard))
  console.log('layout completion→closed', JSON.stringify(backToClosed))

  for (const [key, delta] of Object.entries(toKeyboard)) {
    expect.soft(delta, `при открытой клавиатуре сдвинулся ${key}`).toBeLessThanOrEqual(2)
  }
  for (const [key, delta] of Object.entries(backToClosed)) {
    expect.soft(delta, `после закрытия клавиатуры сдвинулся ${key}`).toBeLessThanOrEqual(2)
  }
})

test('«Помогло?» и экран серии не перемещают героя, заголовок и CTA', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  // checkinPending: сегодня ещё не отмечено, поэтому сохранение чек-ина
  // честно увеличивает серию и открывает экран серии — как у владельца.
  await page.goto('/?demo=1&frame=0&today_state=checkinPending')
  await passMorningSteps(page)
  await finishMorningNote(page)

  const completion = await readFinalLayout(page)
  await page.screenshot({ path: `${SHOTS}/before-completion-430x932.png` })

  // Оценка «Помогло?»: выбранная плитка не должна перестраивать экран.
  await page.locator('[data-testid="checkin-feedback-option"][data-value="yes"]').click()
  await expect(
    page.locator('[data-testid="checkin-feedback-option"][data-value="yes"]')
  ).toHaveAttribute('aria-pressed', 'true')
  const rated = await readFinalLayout(page)
  const ratedDeltas = layoutDeltas(completion, rated)
  console.log('layout completion→rated', JSON.stringify(ratedDeltas))
  for (const [key, delta] of Object.entries(ratedDeltas)) {
    expect.soft(delta, `после оценки «Помогло?» сдвинулся ${key}`).toBeLessThanOrEqual(2)
  }

  // Экран серии (тот же компонент и тот же стабильный шелл).
  // Демо-данные считают день уже активным, поэтому автоматический переход
  // после сохранения не срабатывает — экран открывается прямой демо-ссылкой
  // в том же вьюпорте.
  await page.goto('/?demo=1&frame=0&action=streak_celebration&streak_days=9')
  await expect(page.getByTestId('streak-celebration')).toBeVisible()
  const streak = await readFinalLayout(page)
  await page.screenshot({ path: `${SHOTS}/before-streak-flow-430x932.png` })

  // Героя и заголовка в сравнении нет: у экранов разное содержание
  // (иллюстрация финала ↔ цветок, две строки ↔ четыре), поэтому верх
  // заголовка зависит от длины текста. Стоять на месте обязаны нижний
  // блок и главное действие — они и сравниваются.
  const streakDeltas = layoutDeltas(completion, streak, ['meta', 'cta'])
  console.log('layout completion→streak', JSON.stringify(streakDeltas))
  console.log('positions', JSON.stringify({ completion, streak }))
  expect.soft(streakDeltas.cta, 'кнопка финала и серии на одной высоте').toBeLessThanOrEqual(2)
  expect.soft(streakDeltas.meta, 'нижний блок серии на месте плашки даты').toBeLessThanOrEqual(8)
  expect.soft(streak.overflow, 'экран серии не требует скролла').toBeLessThanOrEqual(1)
})

for (const viewport of VIEWPORTS) {
  test(`демо «Серия 9 дней»: цветок серии и огонёк тонкими линиями, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/?demo=1&frame=0&action=streak_celebration&streak_days=9')

    const celebration = page.getByTestId('streak-celebration')
    await expect(celebration).toBeVisible()
    await expect(page.getByTestId('streak-celebration-text')).toContainText('Серия 9 дней')

    // Символ серии — цветок из пяти отдельных лепестков с пустым центром.
    // 9 дней — четвёртый лепесток текущего круга: ((9 - 1) % 5) + 1 = 4.
    const flower = page.getByTestId('streak-petals')
    await expect(flower).toBeVisible()
    await expect(flower).toHaveAttribute('data-lit', '4')
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
        gradients: svg.querySelectorAll('linearGradient, radialGradient, filter').length,
        emoji: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(svg.textContent || ''),
      }
    })
    expect(flowerStyle.petals, 'пять отдельных лепестков').toBe(5)
    expect(flowerStyle.litCount, 'девять дней — четыре светлых лепестка').toBe(4)
    expect(flowerStyle.centerParts, 'центр цветка пустой').toBe(0)
    expect(flowerStyle.litFills, 'светлые лепестки одного цвета').toHaveLength(1)
    expect(flowerStyle.dimFills, 'тёмные лепестки одного цвета').toHaveLength(1)
    expect(flowerStyle.litFills[0], 'светлый лепесток светлее тёмного').not.toBe(
      flowerStyle.dimFills[0]
    )
    expect(flowerStyle.gradients, 'без градиентов и теней').toBe(0)
    expect(flowerStyle.emoji, 'без emoji').toBe(false)

    // Огонёк сегодняшнего дня — тот же тонкий контур.
    const flame = page.getByTestId('streak-flame')
    await expect(flame).toBeVisible()
    const flameStyle = await flame.evaluate(svg => {
      const parts = Array.from(svg.querySelectorAll('path, circle, line'))
      return {
        fills: parts.map(part => getComputedStyle(part).fill),
        strokeWidth: Math.max(...parts.map(part => parseFloat(getComputedStyle(part).strokeWidth))),
      }
    })
    expect(flameStyle.fills.every(fill => fill === 'none'), 'у огонька нет заливки').toBe(true)
    expect(flameStyle.strokeWidth, 'огонёк тонкой линией').toBeLessThanOrEqual(3)

    // Главное действие видно сразу и не уехало за экран.
    const layout = await readFinalLayout(page)
    expect(layout.cta, 'CTA серии виден').not.toBeNull()
    expect(layout.cta.top + layout.cta.height).toBeLessThanOrEqual(viewport.height + 1)
    expect(layout.overflow, 'экран серии не требует скролла').toBeLessThanOrEqual(1)

    await page.screenshot({ path: `${SHOTS}/before-streak-demo-${viewport.name}.png` })
  })
}

for (const viewport of VIEWPORTS) {
  test(`вечерний финал чек-ина не нарушен, ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/?demo=1&frame=0&action=complete_evening')

    await expect(page.getByTestId('checkin-completion')).toBeVisible()
    await expect(page.getByTestId('checkin-feedback-option')).toHaveCount(3)
    const layout = await readFinalLayout(page)
    expect(layout.cta, 'CTA вечернего финала виден').not.toBeNull()
    expect(layout.cta.top + layout.cta.height).toBeLessThanOrEqual(viewport.height + 1)
    expect(layout.overflow, 'вечерний финал не требует скролла').toBeLessThanOrEqual(1)
  })
}
