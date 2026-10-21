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
 *      росток и огонёк тонкими линиями (без заливок) и не требует скролла.
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
    const box = selector => {
      const el = document.querySelector(selector)
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return { top: Math.round(rect.top), height: Math.round(rect.height) }
    }
    /* Переполнение ближайшей прокручиваемой области вокруг финала:
       у утреннего чек-ина это .mx-step-slide, у вечернего — оболочка. */
    const overflow = () => {
      const section = document.querySelector('.mx-completion')
      if (!section) return null
      let el = section.parentElement
      while (el) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
          return el.scrollHeight - el.clientHeight
        }
        el = el.parentElement
      }
      return 0
    }
    return {
      shell: box('.mx-fullscreen-surface') || box('.mx-demo-checkin'),
      hero: box('.mx-completion__art-wrap'),
      title: box('.mx-completion__title') || box('.mx-streak-celebration__title'),
      meta: box('.mx-completion__date-pill') || box('.mx-streak-celebration__days'),
      cta: box('.mx-completion-action button'),
      overflow: overflow(),
    }
  })
}

/** Сдвиги ключевых элементов между двумя замерами. */
function layoutDeltas(before, after) {
  const deltas = {}
  for (const key of ['hero', 'title', 'meta', 'cta']) {
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
  await page.goto('/?demo=1&frame=0')
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

  // «Сохранить и выйти» → экран серии.
  await page.getByTestId('checkin-back-to-today').click()
  await expect(page.getByTestId('streak-celebration')).toBeVisible()
  const streak = await readFinalLayout(page)
  await page.screenshot({ path: `${SHOTS}/before-streak-flow-430x932.png` })

  const streakDeltas = layoutDeltas(completion, streak)
  console.log('layout completion→streak', JSON.stringify(streakDeltas))
  for (const [key, delta] of Object.entries(streakDeltas)) {
    expect.soft(delta, `на экране серии сдвинулся ${key}`).toBeLessThanOrEqual(2)
  }
  expect.soft(streak.overflow, 'экран серии не требует скролла').toBeLessThanOrEqual(1)
})

for (const viewport of VIEWPORTS) {
  test(`демо «Серия 9 дней»: росток и огонёк тонкими линиями, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/?demo=1&frame=0&action=streak_celebration&streak_days=9')

    const celebration = page.getByTestId('streak-celebration')
    await expect(celebration).toBeVisible()
    await expect(page.getByTestId('streak-celebration-text')).toContainText('Серия 9 дней')

    // Символ серии — росток с двумя листьями, тонкие линии без заливок.
    const sprout = page.getByTestId('streak-sprout')
    await expect(sprout).toBeVisible()
    const sproutStyle = await sprout.evaluate(svg => {
      const parts = Array.from(svg.querySelectorAll('path, circle, line'))
      return {
        parts: parts.length,
        fills: parts.map(part => getComputedStyle(part).fill),
        strokes: parts.map(part => getComputedStyle(part).stroke),
        strokeWidths: parts.map(part => parseFloat(getComputedStyle(part).strokeWidth)),
        gradients: svg.querySelectorAll('linearGradient, radialGradient, filter').length,
        emoji: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(svg.textContent || ''),
      }
    })
    expect(sproutStyle.fills.every(fill => fill === 'none'), 'у ростка нет заливок').toBe(true)
    expect(sproutStyle.strokes.every(stroke => stroke !== 'none'), 'росток рисуется линиями').toBe(
      true
    )
    expect(Math.max(...sproutStyle.strokeWidths), 'линии тонкие').toBeLessThanOrEqual(3)
    expect(sproutStyle.gradients, 'без градиентов и теней').toBe(0)
    expect(sproutStyle.emoji, 'без emoji').toBe(false)

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
