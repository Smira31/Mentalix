import { expect, test } from '@playwright/test'

// Регрессия видимости сегмента «Аналитика | История» на «Прогрессе».
//
// Дефект: в компактном окне Telegram (Desktop, без fullscreen и демо-рамки)
// сегмент-бар был position:relative и уезжал вместе с лентой «Истории» —
// пилюля пропадала с экрана при прокрутке/возврате на вкладку. В fullscreen
// и демо-рамке строка вынесена в полосу кнопок Telegram, там дефекта нет.
//
// Тест проверяет оба режима (Chromium, demo-режим):
//  1. Компактное окно: ?demo=1&frame=0 — сегмент внутри скролл-контейнера
//     обязан оставаться видимым при прокрутке истории (sticky сверху).
//  2. Демо-рамка (эмуляция Telegram fullscreen): ?demo=1 — сегмент
//     вынесен порталом в шапку и остаётся видимым при прокрутке.
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
   shell имеет класс mx-app-shell--fullscreen, сегмент-строка fixed в полосе
   Telegram-контролов (пилюля видима и достижима), а обёртка
   .mx-progress-segment-bar скроллится вместе с лентой — по дизайну.
   Компактный sticky-режим — предмет этого теста — наступает только после
   подтверждения fullscreen=false. Диагностика падения: сегмент НИЧЕМ не
   перекрыт (elementFromPoint в центре пилюли попадает в неё саму),
   обёртка уезжала на -252px именно внутри pessimistic-окна. Поэтому ждём
   конкретного DOM-состояния (исчезновения fullscreen-класса со shell),
   а не таймаута. */
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
      inViewport: box.top >= 0 && box.bottom <= viewportHeight && box.width > 0,
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
    // окне Telegram Desktop его нет, а здесь он перекрывает правую кнопку
    // сегмента (см. комментарий к .mx-real-phone-demo в ProgressAnalytics.css).
    // Переключатель «Demo viewport» (панель предпросмотра Base44) — тот же
    // артефакт: в реальном окне Telegram его нет.
    await page.addStyleTag({
      content: [
        '[data-testid="demo-panel-badge"] { display: none !important; }',
        '.mx-preview-device-switcher { display: none !important; }',
      ].join('\n'),
    })

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

    // Ждём подтверждения compact-режима: внутри pessimistic-окна
    // fullscreen-negotiation обёртка сегмент-бара скроллится по дизайну
    // (пилюлю держит fixed-строка), и проверка геометрии обёртки
    // выполнялась бы в чужом режиме — падение было именно об этом.
    await waitForCompactShell(page)

    // До прокрутки сегмент виден сверху экрана
    const barAtTop = await page.locator('.mx-progress-segment-bar').boundingBox()
    expect(barAtTop, 'Сегмент-бар должен существовать').not.toBeNull()
    expect(barAtTop.y, 'Сегмент-бар должен начинаться у верха экрана').toBeGreaterThanOrEqual(-1)

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
    expect(barBox.y, 'Сегмент-бар должен быть закреплён у верха экрана').toBeGreaterThanOrEqual(-1)
    expect(barBox.y, 'Сегмент-бар не должен уезжать за верх экрана').toBeLessThanOrEqual(60)

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

test.describe('демо-рамка (эмуляция fullscreen)', () => {
  test.use({ viewport: { width: 793, height: 900 } })

  test('сегмент виден при прокрутке «Истории»', async ({ page }) => {
    await page.goto('/?demo=1&tab=trends')

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

    // В рамке сегмент вынесен порталом в шапку Telegram
    const header = page.getByTestId('demo-telegram-header')
    await expect(header).toBeVisible()
    await expect(header.getByTestId('progress-tab-history')).toBeVisible()

    // Переключение на «Историю» и прокрутка ленты вглубь
    await page.getByTestId('progress-tab-history').click()
    await expect(page.getByTestId('progress-tab-history')).toHaveAttribute(
      'aria-selected',
      'true'
    )

    const scrollTop = await scrollToHistoryDepth(page)
    expect(scrollTop, 'Лента истории должна быть прокручена').toBeGreaterThan(200)

    // Пилюля остаётся в шапке и видима после прокрутки
    await expect(header.getByTestId('progress-tab-history')).toBeVisible()
    await expect(header.getByTestId('progress-tab-analytics')).toBeVisible()
  })
})
