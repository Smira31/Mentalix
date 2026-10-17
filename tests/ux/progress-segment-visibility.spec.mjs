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

// Окно Telegram Desktop: ширина как у мини-аппа (~400–450 px)
test.describe('компактное окно (frame=0)', () => {
  test.use({ viewport: { width: 420, height: 700 } })

  test('сегмент виден при прокрутке «Истории»', async ({ page }) => {
    await page.goto('/?demo=1&frame=0&tab=trends')

    await expect(page.getByTestId('progress-tab-analytics')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('progress-tab-history')).toBeVisible()

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
