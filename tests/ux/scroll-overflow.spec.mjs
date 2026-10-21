import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { dayFocusOptionStep, openDayCard, scaleStep } from './checkin-helpers.mjs'

/*
 * fix-scroll-overflow — искусственная прокрутка и нестабильное поведение
 * коротких экранов Mentalix (Issue #1096, аудит владельца; #1077 закрыт).
 *
 * Правило владельца, которое проверяется числами:
 *   1) экран не прокручивается, если весь контент помещается;
 *   2) длинный экран (или открытая клавиатура) сохраняет естественную
 *      прокрутку — ничего не обрезается;
 *   3) нижнее действие (CTA) остаётся доступным при открытой клавиатуре;
 *   4) переходы не сдвигают элементы и не оставляют остаточный scrollTop.
 *
 * Вьюпорты задачи — 360×640 и 430×932. Клавиатура имитируется подменой
 * `visualViewport.height` при неизменном `window.innerHeight` — так ведёт
 * себя iOS/Telegram (тот же приём, что в checkin-streak-stability.spec.mjs).
 *
 * Поиск — только по data-testid (AGENTS.md, MXL-010).
 * Никаких waitForTimeout: ожидаем состояние (expect/waitForFunction).
 *
 * Скриншоты: SCROLL_SHOTS_DIR (по умолчанию test-results/scroll-overflow);
 * постоянный evidence — qa-evidence/scroll-overflow/.
 */

const SHOTS = process.env.SCROLL_SHOTS_DIR || 'test-results/scroll-overflow'

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '430x932', width: 430, height: 932 },
]

const TABS = ['Сегодня', 'Шаги', 'Диалог', 'Библиотека', 'Прогресс']

/* Высота клавиатуры iPhone в Telegram — та же величина, что в целевом
   тесте чек-ина (checkin-streak-stability.spec.mjs). */
const KEYBOARD_HEIGHT = 336

const TODAY = '/?demo=1&frame=0'
const PRACTICES = '/?demo=1&tab=practices&action=rituals_list&frame=0'
const DAIMON = '/?demo=1&tab=practices&sub=daimon&frame=0'

/*
 * Утренний чек-ин в приложении идёт через MorningCheckInFlow (CheckIn.jsx) —
 * поверхность `.mx-demo-checkin`; на шаге заметки тело получает класс
 * `is-editor` и именно оно является скролл-контейнером шага.
 */
const MORNING_BODY = '.mx-demo-checkin__body.is-editor'
const MORNING_QUESTION = '.mx-demo-checkin__editor-scene'
const MORNING_CTA = '[data-testid="checkin-complete"]'

function shotPath(name) {
  fs.mkdirSync(SHOTS, { recursive: true })
  return `${SHOTS}/${name}.png`
}

/*
 * Замеры скролл-контейнера:
 *  - overflow   — сколько пикселей лишней прокрутки (scrollHeight - clientHeight);
 *  - fitsAll    — умещается ли содержимое целиком (без fixed/sticky потомков);
 *  - gutter     — ширина полосы прокрутки, зарезервированной даже без прокрутки
 *                 (признак принудительного overflow-y: scroll);
 *  - box/cta    — координаты в координатах вьюпорта.
 */
function measure(page, targets) {
  return page.evaluate(selectors => {
    function horizontalBorders(el) {
      const cs = getComputedStyle(el)
      return parseFloat(cs.borderLeftWidth || '0') + parseFloat(cs.borderRightWidth || '0')
    }

    function lowestInside(container) {
      const rect = container.getBoundingClientRect()
      const inFixed = el => {
        for (let node = el; node && node !== container; node = node.parentElement) {
          const position = getComputedStyle(node).position
          if (position === 'fixed' || position === 'sticky') return true
        }
        return false
      }

      let lowest = -Infinity
      let name = null
      for (const el of container.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width < 1 || r.height < 1) continue
        if (r.right <= 0 || r.left >= window.innerWidth) continue
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue
        if (inFixed(el)) continue
        if (r.bottom > lowest) {
          lowest = r.bottom
          name =
            el.tagName.toLowerCase() +
            (typeof el.className === 'string' && el.className
              ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
              : '')
        }
      }

      return {
        lowest: Math.round(lowest),
        name,
        bottom: Math.round(rect.bottom),
        fitsAll: lowest === -Infinity || lowest <= rect.bottom + 1,
      }
    }

    function box(el) {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) }
    }

    const result = {
      visualBottom: Math.round(window.visualViewport?.height ?? window.innerHeight),
      innerHeight: Math.round(window.innerHeight),
    }

    for (const [key, selector] of Object.entries(selectors)) {
      const el = document.querySelector(selector)
      if (!el) {
        result[key] = null
        continue
      }
      const inside = lowestInside(el)
      result[key] = {
        overflow: el.scrollHeight - el.clientHeight,
        scrollTop: Math.round(el.scrollTop),
        overflowY: getComputedStyle(el).overflowY,
        gutter: Math.round(el.offsetWidth - el.clientWidth - horizontalBorders(el)),
        fitsAll: inside.fitsAll,
        lowest: inside.lowest,
        lowestName: inside.name,
        bottom: inside.bottom,
        box: box(el),
      }
    }

    return result
  }, targets)
}

/** Положение ключевых элементов поверхности в координатах вьюпорта. */
function readBoxes(page, selectors) {
  return page.evaluate(selectors => {
    const result = {}
    for (const [key, selector] of Object.entries(selectors)) {
      const el = document.querySelector(selector)
      if (!el) {
        result[key] = null
        continue
      }
      const r = el.getBoundingClientRect()
      result[key] = {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
      }
    }
    result.visualBottom = Math.round(window.visualViewport?.height ?? window.innerHeight)
    result.shell = (() => {
      const shell = document.querySelector('.mx-fullscreen-surface, .mx-demo-checkin')
      if (!shell) return null
      const r = shell.getBoundingClientRect()
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) }
    })()
    return result
  }, selectors)
}

/*
 * Клавиатура iOS/Telegram уменьшает visualViewport, но не window.innerHeight.
 * Подменяем только высоту visualViewport и сообщаем приложению штатным resize.
 */
async function stubKeyboard(page, keyboardHeight) {
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
  await page.evaluate(
    () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
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
  await page.evaluate(
    () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
}

/** Прохождение утреннего чек-ина до текстового шага («Что на уме?»). */
async function passMorningSteps(page) {
  await openDayCard(page, 'morning')
  for (const level of [4, 3, 3, 3]) await scaleStep(page, level)
  await dayFocusOptionStep(page, 'Работа')
  await expect(page.getByTestId('checkin-text-input')).toBeVisible()
  await expect(page.locator(MORNING_BODY)).toBeVisible()
}

/** Два кадра ожидания: раскладка применила новую геометрию. */
function twoFrames(page) {
  return page.evaluate(
    () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
}

/* ── 1. Короткий экран не прокручивается, длинный — прокручивается ── */

for (const viewport of VIEWPORTS) {
  test(`вкладки: лишней прокрутки нет, естественная остаётся, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(TODAY)
    await expect(page.locator('.mx-app-scroll-root')).toBeVisible({ timeout: 20_000 })

    const report = {}
    for (const label of TABS) {
      const button = page.locator(`.mx-bottom-nav nav button[aria-label="${label}"]`)
      await expect(button).toBeVisible({ timeout: 15_000 })
      await button.click()
      await expect(button).toHaveAttribute('aria-current', 'page')
      await expect(page.locator('.mx-app-scroll-root')).toBeVisible()
      await twoFrames(page)

      const { tab } = await measure(page, { tab: '.mx-app-scroll-root' })
      report[label] = {
        overflow: tab.overflow,
        fitsAll: tab.fitsAll,
        scrollTop: tab.scrollTop,
        lowest: `${tab.lowestName}@${tab.lowest}`,
      }
    }

    console.log(`tabs ${viewport.name}`, JSON.stringify(report))
    await page.screenshot({ path: shotPath(`tabs-${viewport.name}`) })

    for (const [label, tab] of Object.entries(report)) {
      if (tab.fitsAll) {
        // Контент помещается целиком — экран не должен прокручиваться вовсе.
        expect.soft(
          tab.overflow,
          `${label} @ ${viewport.name}: контент умещается (${tab.lowest}, низ контейнера), но экран прокручивается на ${tab.overflow}px`
        ).toBeLessThanOrEqual(0)
      } else {
        // Длинный экран обязан сохранить естественную прокрутку.
        expect.soft(
          tab.overflow,
          `${label} @ ${viewport.name}: длинному экрану нужна прокрутка`
        ).toBeGreaterThan(0)
      }
    }
  })
}

/* ── 2. Утренний чек-ин: шаг заметки не прокручивается сам по себе ── */

for (const viewport of VIEWPORTS) {
  test(`утренний чек-ин: шаг заметки без принудительной прокрутки, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(TODAY)
    await passMorningSteps(page)

    const { body } = await measure(page, { body: MORNING_BODY })
    console.log(`checkin note ${viewport.name}`, JSON.stringify(body))
    await page.screenshot({ path: shotPath(`checkin-note-${viewport.name}`) })

    expect(body, 'скролл-контейнер шага заметки найден').not.toBeNull()
    // Пока контент помещается, область не прокручивается и не держит полосу.
    if (body.fitsAll) {
      expect(body.overflow, `${viewport.name}: лишняя прокрутка шага заметки`).toBeLessThanOrEqual(0)
    } else {
      expect(
        body.overflow,
        `${viewport.name}: содержимое шага заметки обрезано без прокрутки`
      ).toBeGreaterThan(0)
    }
    expect(
      body.gutter,
      `${viewport.name}: полоса прокрутки зарезервирована без прокрутки (overflow-y: ${body.overflowY})`
    ).toBeLessThanOrEqual(0)
  })
}

/* ── 3. Клавиатура: нижнее действие и поле остаются доступными ── */

for (const viewport of VIEWPORTS) {
  test(`утренний чек-ин: CTA виден при клавиатуре, ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(TODAY)
    await passMorningSteps(page)

    await page.getByTestId('checkin-text-input').fill('Проверка прокрутки и клавиатуры')
    const beforeKeyboard = await readBoxes(page, {
      field: '[data-testid="checkin-text-input"]',
      cta: MORNING_CTA,
      question: MORNING_QUESTION,
    })

    await stubKeyboard(page, KEYBOARD_HEIGHT)
    const withKeyboard = await readBoxes(page, {
      field: '[data-testid="checkin-text-input"]',
      cta: MORNING_CTA,
      question: MORNING_QUESTION,
    })
    await page.screenshot({ path: shotPath(`checkin-note-keyboard-${viewport.name}`) })

    console.log(
      `checkin keyboard ${viewport.name}`,
      JSON.stringify({ beforeKeyboard, withKeyboard })
    )

    expect(withKeyboard.cta, 'кнопка шага найдена').not.toBeNull()
    expect(
      withKeyboard.cta.bottom,
      `${viewport.name}: кнопка шага ушла под клавиатуру (${withKeyboard.cta.bottom} > ${withKeyboard.visualBottom})`
    ).toBeLessThanOrEqual(withKeyboard.visualBottom)
    expect(
      withKeyboard.field.top,
      `${viewport.name}: поле заметки ушло за верх видимой части`
    ).toBeGreaterThanOrEqual(0)

    await restoreViewport(page)
    const closed = await readBoxes(page, {
      field: '[data-testid="checkin-text-input"]',
      cta: MORNING_CTA,
      question: MORNING_QUESTION,
    })
    // Закрытие клавиатуры не двигает нижнее действие больше чем на 2px.
    expect(
      Math.abs(closed.cta.bottom - beforeKeyboard.cta.bottom),
      `${viewport.name}: после закрытия клавиатуры кнопка сдвинулась`
    ).toBeLessThanOrEqual(2)
  })
}

for (const viewport of VIEWPORTS) {
  test(`«Свой ритуал»: поле и CTA доступны при клавиатуре, ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(PRACTICES)

    await page.getByTestId('practice-new-pill').click()
    await expect(page.getByTestId('practice-preset-card').first()).toBeVisible()
    await page.getByTestId('practice-own-pill').click()

    const field = page.getByTestId('practice-own-input-0')
    await expect(field).toBeVisible()
    await field.fill('Тихое утро')

    await stubKeyboard(page, KEYBOARD_HEIGHT)
    const withKeyboard = await readBoxes(page, {
      field: '[data-testid="practice-own-input-0"]',
      cta: '[data-testid="practice-own-go"]',
      question: '.mx-journal-field__question',
      hint: '.mx-journal-field__hint',
    })
    const body = await measure(page, { body: '.mx-screen__body' })
    await page.screenshot({ path: shotPath(`practice-keyboard-${viewport.name}`) })
    console.log(`practice keyboard ${viewport.name}`, JSON.stringify({ withKeyboard, body }))

    expect(withKeyboard.cta, 'кнопка «Далее» найдена').not.toBeNull()
    expect(
      withKeyboard.cta.bottom,
      `${viewport.name}: кнопка «Далее» ушла под клавиатуру`
    ).toBeLessThanOrEqual(withKeyboard.visualBottom)
    expect(
      withKeyboard.field.top,
      `${viewport.name}: поле ввода обрезано сверху (${withKeyboard.field.top})`
    ).toBeGreaterThanOrEqual(0)
    expect(
      withKeyboard.field.bottom,
      `${viewport.name}: поле ввода обрезано снизу и недоступно`
    ).toBeLessThanOrEqual(withKeyboard.visualBottom)
    // Вопрос и подсказка шага не должны уходить за границы видимой части.
    for (const key of ['question', 'hint']) {
      expect(withKeyboard[key], `${key} найден`).not.toBeNull()
      expect(
        withKeyboard[key].top,
        `${viewport.name}: ${key} обрезан сверху (${JSON.stringify(withKeyboard[key])})`
      ).toBeGreaterThanOrEqual(0)
      expect(
        withKeyboard[key].bottom,
        `${viewport.name}: ${key} обрезан снизу (${JSON.stringify(withKeyboard[key])})`
      ).toBeLessThanOrEqual(withKeyboard.visualBottom)
    }

    // Тело экрана не должно прятать содержимое: либо всё видно, либо есть
    // естественная прокрутка до последнего элемента.
    expect(
      body.body.fitsAll || body.body.overflow > 0,
      `${viewport.name}: содержимое формы обрезано (низ ${body.body.lowestName} на ${body.body.lowest}, низ тела ${body.body.bottom}, overflow-y: ${body.body.overflowY})`
    ).toBe(true)

    await restoreViewport(page)
  })
}

for (const viewport of VIEWPORTS) {
  test(`Даймон: запрос и его кнопка доступны при клавиатуре, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(DAIMON)

    await expect(page.getByTestId('daimon-start')).toBeVisible({ timeout: 20_000 })
    await page.getByTestId('daimon-start').click()
    const field = page.getByTestId('daimon-request-input')
    await expect(field).toBeVisible()
    await field.fill('Не понимаю, куда двигаться дальше')

    await stubKeyboard(page, KEYBOARD_HEIGHT)
    const withKeyboard = await readBoxes(page, {
      field: '[data-testid="daimon-request-input"]',
      cta: '[data-testid="daimon-request-submit"]',
      title: '.mx-daimon-request__title',
    })
    await page.screenshot({ path: shotPath(`daimon-request-keyboard-${viewport.name}`) })
    console.log(`daimon keyboard ${viewport.name}`, JSON.stringify(withKeyboard))

    expect(withKeyboard.cta, 'кнопка запроса найдена').not.toBeNull()
    expect(
      withKeyboard.cta.bottom,
      `${viewport.name}: кнопка запроса ушла под клавиатуру`
    ).toBeLessThanOrEqual(withKeyboard.visualBottom)
    expect(
      withKeyboard.cta.top,
      `${viewport.name}: кнопка запроса ушла за верх видимой части`
    ).toBeGreaterThanOrEqual(0)
    expect(
      withKeyboard.field.top,
      `${viewport.name}: поле запроса обрезано сверху`
    ).toBeGreaterThanOrEqual(0)

    await restoreViewport(page)
  })
}

/* ── 4. Длинный экран: естественная прокрутка ничего не обрезает ── */

for (const viewport of VIEWPORTS) {
  test(`длинный экран: прокрутка доходит до конца без обрезки, ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(TODAY)

    const root = page.locator('.mx-app-scroll-root')
    await expect(root).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('today-card-morning')).toBeVisible({ timeout: 20_000 })

    const { tab } = await measure(page, { tab: '.mx-app-scroll-root' })
    expect(tab.overflow, `${viewport.name}: длинный экран обязан прокручиваться`).toBeGreaterThan(0)
    expect(tab.fitsAll, 'на этом экране содержимое длиннее вьюпорта').toBe(false)

    // Прокрутка до конца: содержимое «Сегодня» доходит до низа контейнера,
    // то есть весь экран достижим и ничего не обрезано.
    await root.evaluate(el => {
      el.scrollTop = el.scrollHeight
    })
    await twoFrames(page)
    const scrolled = await page.evaluate(() => {
      const rootEl = document.querySelector('.mx-app-scroll-root')
      const contentEl = document.querySelector('.mx-scroll-content')
      return {
        scrollTop: Math.round(rootEl.scrollTop),
        maxScroll: rootEl.scrollHeight - rootEl.clientHeight,
        rootBottom: Math.round(rootEl.getBoundingClientRect().bottom),
        contentBottom: Math.round(contentEl.getBoundingClientRect().bottom),
      }
    })
    console.log(`long screen ${viewport.name}`, JSON.stringify(scrolled))
    await page.screenshot({ path: shotPath(`long-screen-bottom-${viewport.name}`) })

    expect(scrolled.scrollTop, 'прокрутка вниз сработала').toBeGreaterThan(0)
    expect(scrolled.scrollTop, 'прокрутка дошла до конца').toBeGreaterThanOrEqual(
      scrolled.maxScroll - 1
    )
    expect(
      scrolled.contentBottom,
      `${viewport.name}: конец экрана недостижим (низ содержимого ${scrolled.contentBottom}, низ контейнера ${scrolled.rootBottom})`
    ).toBeLessThanOrEqual(scrolled.rootBottom + 1)
  })
}

/* ── 5. Переходы: остаточного scrollTop и сдвигов нет ── */

for (const viewport of VIEWPORTS) {
  test(`переходы чек-ина не оставляют остаточной прокрутки, ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(TODAY)
    await passMorningSteps(page)

    await page.getByTestId('checkin-text-input').fill('Проверка перехода')
    await stubKeyboard(page, KEYBOARD_HEIGHT)
    const open = await readBoxes(page, {
      field: '[data-testid="checkin-text-input"]',
      question: MORNING_QUESTION,
    })
    await restoreViewport(page)
    const closed = await readBoxes(page, {
      field: '[data-testid="checkin-text-input"]',
      question: MORNING_QUESTION,
    })

    const { body } = await measure(page, { body: MORNING_BODY })
    console.log(`checkin transition ${viewport.name}`, JSON.stringify({ open, closed, body }))
    await page.screenshot({ path: shotPath(`checkin-transition-${viewport.name}`) })

    expect(body, 'скролл-контейнер найден').not.toBeNull()
    expect(
      body.scrollTop,
      `${viewport.name}: остаточный scrollTop после клавиатуры`
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(closed.question.top - open.question.top) <= 2 || body.overflow > 0,
      `${viewport.name}: вопрос шага заметки скакнул без прокрутки (${open.question.top} → ${closed.question.top})`
    ).toBe(true)
  })
}
