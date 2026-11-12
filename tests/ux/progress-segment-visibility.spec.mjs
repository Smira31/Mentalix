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

/* ── Telegram fullscreen (эмуляция) ──
   Настоящий fullscreen в песочнице не воспроизводится: Telegram SDK строит
   WebApp из hash-параметров запуска (tgWebAppPlatform=ios, tgWebAppVersion=8.0,
   tgWebAppFullscreen=1), поэтому shell получает класс mx-app-shell--fullscreen
   сразу, без demo-рамки (frame=0). В этом режиме на main строка сегмента —
   position: fixed ВНУТРИ .mx-app-scroll-root; iOS WebKit после переключения
   вкладок перестаёт её отрисовывать. Исправление выносит строку порталом
   в .mx-app-shell. Проверка «строка не внутри scroll-root» падает на main. */
function telegramFullscreenPath() {
  const initData = new URLSearchParams({
    query_id: 'AAH-progress-segment',
    user: JSON.stringify({ id: 900001, first_name: 'Сегмент' }),
    auth_date: '1793000000',
    hash: 'test-hash',
  }).toString()

  const hash = new URLSearchParams({
    tgWebAppData: initData,
    tgWebAppVersion: '8.0',
    tgWebAppPlatform: 'ios',
    tgWebAppFullscreen: '1',
  }).toString()

  return `/?demo=1&frame=0&tab=trends#${hash}`
}

async function openTelegramFullscreen(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(() => {
    // Исходящие события Telegram: SDK считает окружение Telegram-клиентом.
    window.TelegramWebviewProxy = { postEvent() {} }
    localStorage.setItem('mx-onboarded-v2', '1')
  })

  const page = await context.newPage()
  await page.goto(telegramFullscreenPath())

  // Переключатель «Demo viewport» и демо-метка — артефакты превью.
  await page.addStyleTag({
    content: [
      '[data-testid="demo-panel-badge"] { display: none !important; }',
      '.mx-preview-device-switcher { display: none !important; }',
      '.mx-preview-demo-note { display: none !important; }',
    ].join('\n'),
  })

  await expect(page.locator('.mx-app-shell.mx-app-shell--fullscreen')).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('progress-tab-history')).toBeVisible()

  return { context, page }
}

/* elementFromPoint в центре каждой кнопки — тап попадает в саму кнопку,
   а не в слой поверх неё. */
async function assertSegmentButtonsHitTest(page, label) {
  const state = await page.evaluate(() => {
    const inspect = testId => {
      const button = document.querySelector(`[data-testid="${testId}"]`)
      if (!button) return { exists: false }

      const box = button.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)

      return {
        exists: true,
        inViewport: box.top >= 0 && box.bottom <= window.innerHeight && box.width > 0,
        hitSelf: hit === button || button.contains(hit),
      }
    }

    return {
      analytics: inspect('progress-tab-analytics'),
      history: inspect('progress-tab-history'),
    }
  })

  for (const [name, value] of Object.entries(state)) {
    expect(value.exists, `Кнопка «${name}» должна существовать (${label})`).toBe(true)
    expect(value.inViewport, `Кнопка «${name}» должна быть в viewport (${label})`).toBe(true)
    expect(value.hitSelf, `Тап в центре «${name}» попадает в кнопку (${label})`).toBe(true)
  }
}

test.describe('Telegram fullscreen (эмуляция)', () => {
  for (const viewport of [
    { width: 393, height: 852 },
    { width: 360, height: 640 },
  ]) {
    test(`сегмент вне scroll-root и видим после 5 переключений и прокрутки (${viewport.width}×${viewport.height})`, async ({
      browser,
    }) => {
      const { context, page } = await openTelegramFullscreen(browser, viewport)

      try {
        const analytics = page.getByTestId('progress-tab-analytics')
        const history = page.getByTestId('progress-tab-history')

        // Критерий 1: строка сегмента — прямой ребёнок shell, не внутри
        // скролл-контейнера. На main эта проверка падает: строка fixed
        // внутри .mx-app-scroll-root.
        const placement = await page.evaluate(() => {
          const row = document.querySelector('.mx-progress-segment-row')
          const shell = document.querySelector('.mx-app-scroll-root')?.closest('.mx-app-shell')

          return {
            exists: Boolean(row),
            inScrollRoot: Boolean(row?.closest('.mx-app-scroll-root')),
            directChildOfShell: Boolean(row && shell && row.parentElement === shell),
            top: row ? row.getBoundingClientRect().top : -1,
            height: row ? row.getBoundingClientRect().height : -1,
          }
        })

        expect(placement.exists, 'Строка сегмента должна существовать').toBe(true)
        expect(placement.inScrollRoot, 'Строка сегмента не должна жить в scroll-root').toBe(false)
        expect(placement.directChildOfShell, 'Строка сегмента порталится в shell').toBe(true)
        expect(placement.height, 'Высота полосы сегмента — 56').toBe(56)

        // 5 переключений подряд: сегмент видим, тапы попадают в кнопки.
        for (let i = 0; i < 5; i += 1) {
          await history.click()
          await expect(history).toHaveAttribute('aria-selected', 'true')
          await expect(page.getByTestId('progress-history-list')).toBeVisible()
          await assertSegmentButtonsHitTest(page, `История, переключение ${i + 1}`)

          await analytics.click()
          await expect(analytics).toHaveAttribute('aria-selected', 'true')
          await assertSegmentButtonsHitTest(page, `Аналитика, переключение ${i + 1}`)
        }

        // Прокрутка ленты «Истории» на 300 px и обратно.
        await history.click()
        await expect(history).toHaveAttribute('aria-selected', 'true')
        await expect(page.getByTestId('progress-history-list')).toBeVisible()

        const scrolledTop = await scrollToHistoryDepth(page, 300)
        expect(scrolledTop, 'Лента истории должна быть прокручена').toBeGreaterThanOrEqual(300)

        const afterScroll = await page.evaluate(() => {
          const row = document.querySelector('.mx-progress-segment-row')
          return {
            inScrollRoot: Boolean(row?.closest('.mx-app-scroll-root')),
            top: row?.getBoundingClientRect().top ?? -1,
          }
        })
        expect(afterScroll.inScrollRoot, 'После прокрутки строка всё ещё вне scroll-root').toBe(
          false
        )
        expect(
          Math.abs(afterScroll.top - placement.top),
          'После прокрутки строка сегмента на прежнем месте'
        ).toBeLessThanOrEqual(1)
        await assertSegmentButtonsHitTest(page, 'История, прокрутка 300 px')

        const restoredTop = await page.evaluate(() => {
          const root = document.querySelector('.mx-app-scroll-root')
          root.scrollTop = 0
          return root.scrollTop
        })
        expect(restoredTop, 'Лента истории возвращается наверх').toBe(0)
        await assertSegmentButtonsHitTest(page, 'История, прокрутка обратно')
      } finally {
        await context.close()
      }
    })
  }

  test('сегмент исчезает на других вкладках и не рисуется поверх листов и записей', async ({
    browser,
  }) => {
    const { context, page } = await openTelegramFullscreen(browser, { width: 393, height: 852 })

    try {
      const analytics = page.getByTestId('progress-tab-analytics')
      const history = page.getByTestId('progress-tab-history')

      // Критерий 3a: ушли с «Прогресса» — портала нет ни на одной вкладке.
      await page.getByRole('button', { name: 'Сегодня', exact: true }).click()
      await expect(page.getByTestId('progress-tab-history')).toHaveCount(0)
      expect(
        await page.evaluate(() => Boolean(document.querySelector('.mx-progress-segment-row')))
      ).toBe(false)

      // Возврат на «Прогресс»: строка снова в shell.
      await page.getByRole('button', { name: 'Прогресс', exact: true }).click()
      await expect(analytics).toBeVisible()
      await expect(history).toBeVisible()

      // Критерий 3b (лист фильтров): строка не пересекает лист и не рисуется
      // поверх него — центр листа принадлежит листу.
      await history.click()
      await expect(history).toHaveAttribute('aria-selected', 'true')
      await page.getByTestId('history-filter-btn').click()

      const filterSheet = page.getByTestId('history-filter-sheet')
      await expect(filterSheet).toBeVisible()

      const filterState = await page.evaluate(() => {
        const row = document.querySelector('.mx-progress-segment-row')
        const sheet = document.querySelector('[data-testid="history-filter-sheet"]')
        if (!row || !sheet) return null

        const rowBox = row.getBoundingClientRect()
        const sheetBox = sheet.getBoundingClientRect()
        const hit = document.elementFromPoint(
          sheetBox.left + sheetBox.width / 2,
          sheetBox.top + Math.min(40, sheetBox.height / 2)
        )

        return {
          overlap: Math.min(rowBox.bottom, sheetBox.bottom) - Math.max(rowBox.top, sheetBox.top),
          sheetHit: sheet === hit || sheet.contains(hit),
        }
      })

      expect(filterState, 'Строка сегмента и лист фильтров должны существовать').not.toBeNull()
      expect(
        filterState.overlap,
        'Строка сегмента не должна перекрывать лист фильтров'
      ).toBeLessThanOrEqual(0)
      expect(filterState.sheetHit, 'Центр листа фильтров принадлежит листу').toBe(true)

      await page.getByTestId('history-filter-close').click()
      await expect(filterSheet).toHaveCount(0)

      // Критерий 3c (экран записи): оверлей записи закрывает полосу сегмента.
      await page.getByTestId('progress-history-row').first().click()
      await expect(page.getByTestId('progress-entry-screen')).toBeVisible()

      const entryState = await page.evaluate(() => {
        const button = document.querySelector('[data-testid="progress-tab-history"]')
        const entry = document.querySelector('[data-testid="progress-entry-screen"]')
        if (!button || !entry) return null

        const box = button.getBoundingClientRect()
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)

        return {
          covered: entry.contains(hit),
          hitIsSegment: hit === button || button.contains(hit),
        }
      })

      expect(entryState, 'Экран записи должен существовать').not.toBeNull()
      expect(entryState.covered, 'В центре сегмента находится экран записи').toBe(true)
      expect(entryState.hitIsSegment, 'Сегмент не рисуется поверх записи').toBe(false)

      // Системная «Назад» Telegram закрывает запись (тот же путь, что на iPhone).
      await page.evaluate(() => window.Telegram.WebView.receiveEvent('back_button_pressed'))
      await expect(page.getByTestId('progress-entry-screen')).toHaveCount(0)
    } finally {
      await context.close()
    }
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
