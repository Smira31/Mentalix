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
