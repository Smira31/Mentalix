import { expect, test } from '@playwright/test'

// Регрессия видимости сегмента «Аналитика | История» на «Прогрессе».
//
// Дефект: в компактном окне Telegram (Desktop, без fullscreen и демо-рамки)
// сегмент-бар был position:relative и уезжал вместе с лентой «Истории» —
// пилюля пропадала с экрана при прокрутке/возврате на вкладку. В fullscreen
// и демо-рамке строка была вынесена в полосу кнопок Telegram, где внутри
// прокрутки на iOS WebKit переставала отрисовываться после переключения
// вкладок. Теперь сегмент живёт в строке кнопок вкладки
// (.mx-progress-actions-row): слева переключатель, справа кнопки вкладки.
//
// Тест проверяет три режима (Chromium, demo-режим):
//  1. Компактное окно: ?demo=1&frame=0 — сегмент в строке кнопок
//     остаётся видимым при прокрутке истории (липкая строка сверху).
//  2. Демо-рамка (эмуляция Telegram fullscreen): ?demo=1 — сегмента нет
//     в полосе Telegram, пять переключений подряд не теряют его.
//  3. Узкие экраны 360×640 и 393×852: все элементы строки внутри полей и
//     совпадают с краями карточек, зона нажатия ≥ 44×44, высоты из одного
//     токена, зазор до заголовка одинаков на обеих вкладках.
//
// Полный ux:check и WebKit остаются CI; локально — только этот файл.

const SCROLL_SETTLE_MS = 250

async function scrollToHistoryDepth(page, minScrollTop = 200) {
  // Эффект восстановления сохранённой позиции вкладки может вернуть
  // scrollTop к нулю сразу после переключения сегмента — ставим позицию
  // после того, как эффект отработал, и при необходимости повторяем.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const scrollTop = await page.evaluate(() => {
      const root = document.querySelector('.mx-app-scroll-root')
      if (!root) return -1
      root.scrollTop = 320
      return root.scrollTop
    })
    await page.waitForTimeout(SCROLL_SETTLE_MS)
    const settled = await page.evaluate(
      () => document.querySelector('.mx-app-scroll-root')?.scrollTop ?? -1
    )
    if (settled >= minScrollTop && scrollTop >= minScrollTop) return settled
  }
  throw new Error('Лента «Истории» не прокручивается до глубины 200px')
}

/* Fullscreen-negotiation (MXL-FULLSCREEN-SURFACE-RACE-001, src/lib/tgFullscreen.js)
   первые ~2 с после загрузки держит pessimistic-снапшот fullscreen=true:
   shell имеет класс mx-app-shell--fullscreen. Компактный sticky-режим —
   предмет этого теста — наступает только после подтверждения
   fullscreen=false. Поэтому ждём конкретного DOM-состояния (исчезновения
   fullscreen-класса со shell), а не таймаута. */
async function waitForCompactShell(page) {
  await page.waitForFunction(
    () => {
      const shell = document.querySelector('.mx-app-shell')
      return Boolean(shell) && !shell.classList.contains('mx-app-shell--fullscreen')
    },
    { timeout: 10_000 }
  )
}

/* Регрессия симптома владельца: «после нажатия "История" переключатель
   исчезает, но тап по его месту открывает Аналитику» — элемент остаётся
   в раскладке (тап работает), а его отрисовка пропадает. Проверяем не
   только Playwright-видимость, а фактическую краску: пилюля в viewport,
   ненулевая высота, opacity 1 (включая предков) и elementFromPoint в
   центре пилюли попадает в неё саму — ничто не перекрывает её. */
async function assertSegmentPaintedAndReachable(page, label) {
  const state = await page.evaluate(() => {
    const pill = document.querySelector('.mx-progress-segment')
    if (!pill) return { exists: false }

    const box = pill.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const center = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    const atCenter = document.elementFromPoint(center.x, center.y)

    // opacity: 1 у самой пилюли и всех предков до <html> — ни один слой
    // не «выключает» её прозрачностью (застрявшая анимация, fade-слой).
    const opacities = []
    for (let node = pill; node && node.nodeType === 1; node = node.parentElement) {
      opacities.push(getComputedStyle(node).opacity)
    }

    return {
      exists: true,
      inViewport:
        box.top >= 0 &&
        box.bottom <= viewportHeight &&
        box.left >= 0 &&
        box.right <= viewportWidth &&
        box.width > 0,
      height: box.height,
      opacities,
      coveredByOther:
        atCenter !== null && !(atCenter === pill || pill.contains(atCenter)),
    }
  })

  expect(state.exists, `Сегмент должен существовать (${label})`).toBe(true)
  expect(state.inViewport, `Сегмент должен быть в viewport (${label})`).toBe(true)
  expect(state.height, `Сегмент должен иметь ненулевую высоту (${label})`).toBeGreaterThan(20)
  expect(
    state.opacities,
    `Сегмент и предки должны быть opacity 1 (${label})`
  ).toEqual(state.opacities.map(() => '1'))
  expect(state.coveredByOther, `Сегмент не должен быть перекрыт (${label})`).toBe(false)
}

/* Строка кнопок: слева сегмент, справа кнопки активной вкладки.
   Критерии приёмки PR (ранее проверялся только собственный бокс контейнера,
   поэтому выход кнопки за поля экрана проходил незамеченным):
   1) левый край сегмента и правый край крайней правой кнопки лежат внутри
      полей контента (--mx-screen-x) и совпадают с краями карточек ниже —
      допуск 1 px;
   2) зона нажатия каждого контрола ≥ 44×44 — своя или невидимая
      .mx-tap-target::before, а подписи не обрезаны собственной шириной;
   3) сегмент, пилюля и круглые кнопки одной высоты, равной токену
      --mx-progress-actions-h;
   4) зазор до заголовка возвращается наружу: тест сравнивает его между
      вкладками, чтобы он не зависел от экрана. */
const ROW_EDGE_TOLERANCE = 1
const MIN_TAP_SIZE = 44

async function assertActionsRowLayout(page, label) {
  const state = await page.evaluate(() => {
    const rect = el => el.getBoundingClientRect()
    const row = document.querySelector('[data-testid="progress-actions-row"]')
    const segment = document.querySelector('.mx-progress-segment')
    const actions = document.querySelector('[data-testid="progress-row-actions"]')
    if (!row || !segment || !actions) return { exists: false }

    const root = document.querySelector('.mx-progress-redesign')
    const rootStyle = getComputedStyle(root)
    const rootBox = rect(root)
    const content = {
      left: rootBox.left + parseFloat(rootStyle.paddingLeft),
      right: rootBox.right - parseFloat(rootStyle.paddingRight),
    }

    // Поля экрана сверяем с краями карточек контента ниже строки.
    const card = root.querySelector(
      '.mx-progress-card, .mx-progress-mood-card, .mx-progress-history__group, ' +
        '.mx-progress-history__empty, .mx-progress-history__period-section'
    )

    const controls = [segment, ...actions.querySelectorAll('button')].filter(
      el => el.offsetParent !== null
    )
    const metrics = controls.map(el => {
      const box = rect(el)
      const before = getComputedStyle(el, '::before')
      const hasBefore = before.content !== 'none' && before.content !== 'normal'
      return {
        id: el.getAttribute('data-testid') || el.className.split(' ')[0],
        label: el.textContent.trim(),
        left: box.left,
        right: box.right,
        height: box.height,
        tapWidth: hasBefore ? Math.max(box.width, parseFloat(before.width) || 0) : box.width,
        tapHeight: hasBefore ? Math.max(box.height, parseFloat(before.height) || 0) : box.height,
        clipped: el.scrollWidth > el.clientWidth + 1,
      }
    })

    const title = root.querySelector('.mx-progress-analytics__title, .mx-progress-history__title')
    const rowBox = rect(row)

    return {
      exists: true,
      content,
      card: card ? { left: rect(card).left, right: rect(card).right } : null,
      controls: metrics,
      heights: [...new Set(metrics.map(item => Math.round(item.height)))],
      tokenHeight: Math.round(
        parseFloat(getComputedStyle(row).getPropertyValue('--mx-progress-actions-h')) || 0
      ),
      titleGap: title ? +(rect(title).top - rowBox.bottom).toFixed(1) : null,
    }
  })

  expect(state.exists, `Строка кнопок должна существовать (${label})`).toBe(true)

  const first = state.controls[0]
  const last = state.controls[state.controls.length - 1]

  expect(
    first.left,
    `Левый край сегмента внутри полей экрана (${label})`
  ).toBeGreaterThanOrEqual(state.content.left - ROW_EDGE_TOLERANCE)
  expect(
    last.right,
    `Правый край последней кнопки внутри полей экрана (${label})`
  ).toBeLessThanOrEqual(state.content.right + ROW_EDGE_TOLERANCE)

  if (state.card) {
    expect(
      Math.abs(first.left - state.card.left),
      `Сегмент должен совпадать с левым краем карточки ниже (${label})`
    ).toBeLessThanOrEqual(ROW_EDGE_TOLERANCE)
    expect(
      Math.abs(last.right - state.card.right),
      `Последняя кнопка должна совпадать с правым краем карточки ниже (${label})`
    ).toBeLessThanOrEqual(ROW_EDGE_TOLERANCE)
  }

  const smallTapTargets = state.controls
    .filter(item => item.tapWidth < MIN_TAP_SIZE - 0.5 || item.tapHeight < MIN_TAP_SIZE - 0.5)
    .map(item => `${item.id || item.label}: ${Math.round(item.tapWidth)}×${Math.round(item.tapHeight)}`)
  expect(smallTapTargets, `Зона нажатия каждого контрола ≥ 44×44 (${label})`).toEqual([])

  expect(
    state.controls.filter(item => item.clipped).map(item => item.label),
    `Текст кнопок не должен обрезаться (${label})`
  ).toEqual([])

  expect(state.tokenHeight, `Токен высоты строки должен быть задан (${label})`).toBe(
    MIN_TAP_SIZE
  )
  expect(state.heights, `Сегмент, пилюля и круглые кнопки одной высоты (${label})`).toEqual([
    state.tokenHeight,
  ])

  return state
}

// Окно Telegram Desktop: ширина как у мини-аппа (~400–450 px)
test.describe('компактное окно (frame=0)', () => {
  test.use({ viewport: { width: 420, height: 700 } })

  test('сегмент видим и не перекрыт сразу после переключения вкладок', async ({ page }) => {
    await page.goto('/?demo=1&frame=0&tab=trends')

    // Бейдж демо-панели и переключатель «Demo viewport» — превью-артефакты
    // (см. тест выше).
    await page.addStyleTag({
      content: [
        '[data-testid="demo-panel-badge"] { display: none !important; }',
        '.mx-preview-device-switcher { display: none !important; }',
      ].join('\n'),
    })

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

    // Ждём подтверждения compact-режима (окончания pessimistic-окна
    // fullscreen-negotiation), чтобы проверять именно sticky-путь.
    await waitForCompactShell(page)

    // До переключения пилюля нарисована и доступна
    await assertSegmentPaintedAndReachable(page, 'на «Аналитике»')
    await assertActionsRowLayout(page, 'Аналитика')

    // Нажатие «История»: пилюля обязана остаться видимой — в viewport,
    // с высотой, opacity 1, ничем не перекрытая.
    await page.getByTestId('progress-tab-history').click()
    await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    // Лента истории смонтировалась (эффект восстановления скролла отработал).
    await expect(page.getByTestId('progress-history-list')).toBeVisible()
    await assertSegmentPaintedAndReachable(page, 'после нажатия «История»')
    await assertActionsRowLayout(page, 'История')

    // Возврат на «Аналитику» — пилюля снова полностью видима.
    await page.getByTestId('progress-tab-analytics').click()
    await expect(page.getByTestId('progress-tab-analytics')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await assertSegmentPaintedAndReachable(page, 'после возврата на «Аналитику»')
  })

  test('сегмент виден при прокрутке «Истории»', async ({ page }) => {
    await page.goto('/?demo=1&frame=0&tab=trends')

    // Бейдж демо-панели (fixed, z-index 9999) — превью-артефакт: в реальном
    // окне Telegram Desktop его нет. Переключатель «Demo viewport» (панель
    // предпросмотра Base44) — тот же артефакт.
    await page.addStyleTag({
      content: [
        '[data-testid="demo-panel-badge"] { display: none !important; }',
        '.mx-preview-device-switcher { display: none !important; }',
      ].join('\n'),
    })

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

    // Ждём подтверждения compact-режима: внутри pessimistic-окна
    // fullscreen-negotiation проверка геометрии обёртки выполнялась бы
    // в чужом режиме — падение было именно об этом.
    await waitForCompactShell(page)

    // До прокрутки строка кнопок стоит ниже полосы Telegram: в эмуляции
    // fullscreen без рамки шапка с пилюлями рисуется, значит верх прокрутки —
    // это safe-top (статус-бар) + 56 px контролов, а не 0.
    const barAtTop = await page.locator('.mx-progress-segment-bar').boundingBox()
    expect(barAtTop, 'Сегмент-бар должен существовать').not.toBeNull()
    expect(barAtTop.y, 'Сегмент-бар должен начинаться у верха экрана').toBeGreaterThanOrEqual(-1)
    await assertTelegramControlsClearance(page, 'компактное окно, до прокрутки')

    // Переключение на «Историю» и прокрутка ленты вглубь
    await page.getByTestId('progress-tab-history').click()
    await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
      'aria-selected',
      'true'
    )

    const scrollTop = await scrollToHistoryDepth(page)
    expect(scrollTop, 'Лента истории должна быть прокручена').toBeGreaterThan(200)

    // Сегмент закреплён сверху и остаётся видимым после прокрутки
    const bar = page.locator('.mx-progress-segment-bar')
    await expect(bar).toBeVisible()
    const barBox = await bar.boundingBox()
    expect(barBox, 'Сегмент-бар должен иметь геометрию').not.toBeNull()
    // Липкая строка останавливается на верхе прокручиваемой области — то есть
    // сразу под полосой кнопок Telegram, а не под ней и не за верхом экрана.
    const scrollViewportTop = await page.evaluate(
      () => document.querySelector('.mx-app-scroll-root')?.getBoundingClientRect().top ?? -1
    )
    expect(scrollViewportTop, 'Прокручиваемая область должна иметь верх').toBeGreaterThan(0)
    expect(
      Math.abs(barBox.y - scrollViewportTop),
      'Липкая строка должна стоять на верхе прокрутки (сразу под полосой Telegram)'
    ).toBeLessThanOrEqual(1)
    await assertTelegramControlsClearance(page, 'компактное окно, после прокрутки')

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible()
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

    // Переключение обратно на «Аналитику» с глубокого скролла истории
    await page.getByTestId('progress-tab-analytics').click()
    await expect(page.getByTestId('progress-tab-analytics')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible()
  })
})

test.describe('демо-рамка (эмуляция Telegram fullscreen)', () => {
  test.use({ viewport: { width: 793, height: 900 } })

  test('сегмент в строке кнопок, вне полосы Telegram, пять переключений подряд', async ({
    page,
  }) => {
    await page.goto('/?demo=1&tab=trends')

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

    // В полосе кнопок Telegram (демо-шапка) сегмента больше нет
    await expect(page.getByTestId('demo-telegram-header')).toHaveCount(0)

    // Сегмент стоит в строке кнопок вкладки, слева от кнопки периода
    await assertActionsRowLayout(page, 'Аналитика')
    const segmentBox = await page.locator('.mx-progress-segment').boundingBox()
    const periodBox = await page.getByTestId('progress-period-trigger').boundingBox()
    expect(
      segmentBox.x + segmentBox.width,
      'Кнопка периода должна быть справа от сегмента'
    ).toBeLessThanOrEqual(periodBox.x + 1)
    await assertSegmentPaintedAndReachable(page, 'Аналитика')

    for (let index = 1; index <= 5; index += 1) {
      await page.getByTestId('progress-tab-history').click()
      await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await expect(page.getByTestId('history-action-buttons')).toBeVisible()
      await assertSegmentPaintedAndReachable(page, `История, переключение ${index}`)
      await assertActionsRowLayout(page, `История, переключение ${index}`)

      await page.getByTestId('progress-tab-analytics').click()
      await expect(page.getByTestId('progress-tab-analytics')).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await assertSegmentPaintedAndReachable(page, `Аналитика, переключение ${index}`)
      await assertActionsRowLayout(page, `Аналитика, переключение ${index}`)
    }
  })
})

/*
 * Эмуляция Telegram fullscreen без рамки (?demo=1&frame=0): шапка с пилюлями
 * Telegram («Закрыть», «⌄ ⋯») нарисована, значит приложение обязано оставить
 * под ней место — как на устройстве в fullscreen, где стекло занимает
 * safe-top (статус-бар) + 56 px (пилюли Telegram, TG_CONTROLS_HEIGHT).
 *
 * Дефект 6186ebe: в этой эмуляции шапка рисовалась, а верхние инсеты задавала
 * только рамка. После согласования fullscreen-режима (см.
 * src/lib/tgFullscreen.js) shell получал padding-top: 0, строка кнопок
 * вставала на y = 12, липкая строка прилипала к y = 0 — под статус-баром и
 * пилюлями, а пилюли «Закрыть/⋯» (y = 62…92) накрывали заголовок «история.».
 *
 * Порог полосы Telegram берётся из самой эмуляции: высота нарисованного
 * статус-бара — это и есть --app-safe-top этой рамки (в демо-рамке
 * --app-safe-top = --demo-statusbar-h), плюс 56 px контролов.
 */
const TG_CONTROLS_H = 56

async function assertTelegramControlsClearance(page, label) {
  const state = await page.evaluate(() => {
    const shell = document.querySelector('.mx-app-shell')
    const row = document.querySelector('[data-testid="progress-actions-row"]')
    const chrome = document.querySelector('[data-demo-chrome="true"]')
    const status = chrome?.querySelector('.mx-demo-telegram-chrome__status')
    const title = document.querySelector(
      '.mx-progress-analytics__title, .mx-progress-history__title'
    )
    if (!shell || !row || !chrome || !status) return { exists: false }

    const box = el => el.getBoundingClientRect()
    const overlaps = (a, b) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
    const pills = [...chrome.querySelectorAll('.mx-demo-telegram-chrome__pill')].map(box)
    const rowBox = box(row)
    const titleBox = title ? box(title) : null
    const hits = id => {
      const el = document.querySelector(`[data-testid="${id}"]`)
      if (!el) return false
      const b = box(el)
      const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
      return Boolean(at) && (at === el || el.contains(at))
    }

    return {
      exists: true,
      safeTop: +box(status).height.toFixed(1),
      rowTop: +rowBox.top.toFixed(1),
      pills: pills.map(b => ({ top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1) })),
      rowOverPills: pills.filter(b => overlaps(rowBox, b)).length,
      titleOverPills: titleBox ? pills.filter(b => overlaps(titleBox, b)).length : 0,
      analyticsHit: hits('progress-tab-analytics'),
      historyHit: hits('progress-tab-history'),
      scrollTop: document.querySelector('.mx-app-scroll-root')?.scrollTop ?? null,
    }
  })

  expect(state.exists, `Демо-шапка Telegram и строка кнопок должны быть (${label})`).toBe(true)
  expect(
    state.rowTop,
    `Верх строки кнопок ниже полосы Telegram: ≥ ${state.safeTop} + ${TG_CONTROLS_H} (${label})`
  ).toBeGreaterThanOrEqual(state.safeTop + TG_CONTROLS_H - 0.5)
  expect(state.rowOverPills, `Кнопки Telegram не перекрывают строку кнопок (${label})`).toBe(0)
  expect(state.titleOverPills, `Кнопки Telegram не перекрывают заголовок (${label})`).toBe(0)
  expect(state.analyticsHit, `В центре «Аналитика» сама кнопка (${label})`).toBe(true)
  expect(state.historyHit, `В центре «История» сама кнопка (${label})`).toBe(true)
  return state
}

/* Прокрутка ленты «Истории» до точной позиции (0 или 300 px). */
async function scrollToDepth(page, depth) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const settled = await page.evaluate(target => {
      const root = document.querySelector('.mx-app-scroll-root')
      if (!root) return -1
      root.scrollTop = target
      return root.scrollTop
    }, depth)
    await page.waitForTimeout(SCROLL_SETTLE_MS)
    const after = await page.evaluate(
      () => document.querySelector('.mx-app-scroll-root')?.scrollTop ?? -1
    )
    if (Math.abs(after - depth) <= 2 && Math.abs(settled - depth) <= 2) return after
  }
  throw new Error(`Лента «Истории» не прокручивается до ${depth}px`)
}

/* Вне Telegram (мобильный веб: демо-шапка не рисуется, рамки нет) —
   прежнее поведение: строка прилипает к верху экрана, лишнего пустого
   места сверху нет. */
test.describe('мобильный веб без Telegram', () => {
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true })

  test('строка прилипает к верху, пустого места нет', async ({ page }) => {
    await page.goto('/?demo=1&frame=0&tab=trends')

    await page.addStyleTag({
      content: [
        '[data-testid="demo-panel-badge"] { display: none !important; }',
        '.mx-preview-device-switcher { display: none !important; }',
      ].join('\n'),
    })

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
    await waitForCompactShell(page)
    await expect(page.locator('[data-demo-chrome="true"]')).toHaveCount(0)

    const atRest = await page.evaluate(() => ({
      shellPaddingTop: getComputedStyle(document.querySelector('.mx-app-shell')).paddingTop,
      barTop: document.querySelector('.mx-progress-segment-bar').getBoundingClientRect().top,
    }))
    expect(atRest.shellPaddingTop, 'Без Telegram у shell нет верхнего инсета').toBe('0px')
    expect(atRest.barTop, 'Строка начинается у верха экрана, без лишнего места').toBeLessThan(60)

    await page.getByTestId('progress-tab-history').click()
    await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByTestId('progress-history-list')).toBeVisible()
    await scrollToDepth(page, 300)

    const scrolled = await page.evaluate(() => ({
      rootTop: document.querySelector('.mx-app-scroll-root')?.getBoundingClientRect().top ?? -1,
      barTop: document.querySelector('.mx-progress-segment-bar').getBoundingClientRect().top,
    }))
    expect(
      Math.abs(scrolled.barTop - scrolled.rootTop),
      'Без Telegram липкая строка стоит на верхе экрана'
    ).toBeLessThanOrEqual(1)
  })
})

const FULLSCREEN_VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 393, height: 852 },
]

for (const viewport of FULLSCREEN_VIEWPORTS) {
  const size = `${viewport.width}×${viewport.height}`

  test.describe(`эмуляция Telegram fullscreen на ${size} (frame=0, демо-шапка)`, () => {
    test.use({ viewport })

    test('строка кнопок и заголовок ниже полосы Telegram, прокрутка 0 и 300 px', async ({
      page,
    }) => {
      await page.goto('/?demo=1&frame=0&tab=trends')

      await page.addStyleTag({
        content: [
          '[data-testid="demo-panel-badge"] { display: none !important; }',
          '.mx-preview-device-switcher { display: none !important; }',
        ].join('\n'),
      })

      // Эмуляция Telegram включена: шапка с пилюлями нарисована.
      await expect(page.locator('[data-demo-chrome="true"]')).toBeVisible({ timeout: 15_000 })
      await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
      await waitForCompactShell(page)

      // «Аналитика», прокрутка 0
      await assertTelegramControlsClearance(page, `Аналитика, прокрутка 0, ${size}`)
      await page.screenshot({ path: `artifacts/progress-segment/${size}-analytics-0.png` })

      // «История», прокрутка 0
      await page.getByTestId('progress-tab-history').click()
      await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await expect(page.getByTestId('progress-history-list')).toBeVisible()
      await assertTelegramControlsClearance(page, `История, прокрутка 0, ${size}`)
      await page.screenshot({ path: `artifacts/progress-segment/${size}-history-0.png` })

      // «История», прокрутка 300 px: липкая строка под полосой Telegram
      await scrollToDepth(page, 300)
      await assertTelegramControlsClearance(page, `История, прокрутка 300, ${size}`)
      await page.screenshot({ path: `artifacts/progress-segment/${size}-history-300.png` })

      // Назад к 0: строка на месте, ничего не уехало под шапку
      await scrollToDepth(page, 0)
      await assertTelegramControlsClearance(page, `История, возврат к 0, ${size}`)

      // «Аналитика» после возврата
      await page.getByTestId('progress-tab-analytics').click()
      await expect(page.getByTestId('progress-tab-analytics')).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await assertTelegramControlsClearance(page, `Аналитика после возврата, ${size}`)
    })
  })
}

/* Критерии приёмки по геометрии строки: 360×640 и 393×852, обе вкладки.
   Самая тесная раскладка — «История» с группировкой «Недели»: пилюля шире,
   чем «Дни», поэтому проверяем и её. */
const ROW_VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 393, height: 852 },
]

for (const viewport of ROW_VIEWPORTS) {
  const size = `${viewport.width}×${viewport.height}`

  test.describe(`поля строки на ${size} (frame=0)`, () => {
    test.use({ viewport })

    test('строка кнопок внутри полей на обеих вкладках', async ({ page }) => {
      await page.goto('/?demo=1&frame=0&tab=trends')

      await page.addStyleTag({
        content: [
          '[data-testid="demo-panel-badge"] { display: none !important; }',
          '.mx-preview-device-switcher { display: none !important; }',
        ].join('\n'),
      })

      await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
      const analytics = await assertActionsRowLayout(page, `Аналитика, ${size}`)

      await page.getByTestId('progress-tab-history').click()
      await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
        'aria-selected',
        'true'
      )
      await expect(page.getByTestId('history-action-buttons')).toBeVisible()
      const historyDays = await assertActionsRowLayout(page, `История, «Дни», ${size}`)

      // Самая широкая пилюля группировки — «Недели»
      await page.getByTestId('history-grouping-pill').click()
      await page.getByTestId('history-grouping-week').click()
      await expect(page.getByTestId('history-grouping-pill')).toContainText('Недели')
      const historyWeeks = await assertActionsRowLayout(page, `История, «Недели», ${size}`)

      expect(
        analytics.titleGap,
        `Зазор от строки до заголовка одинаков на «Аналитике» и «Истории» (${size})`
      ).toBe(historyDays.titleGap)
      expect(
        historyWeeks.titleGap,
        `Зазор от строки до заголовка не зависит от группировки (${size})`
      ).toBe(historyDays.titleGap)
    })
  })
}
