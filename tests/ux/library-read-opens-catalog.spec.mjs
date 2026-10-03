import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

// Один сквозной UX-сценарий; в CI используется общая конфигурация.
test('Библиотека: курс → разделы → шторка → чтение → журнал → следующая → назад', async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 932 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?demo=1&tab=library&frame=0&tgshell=0')
  await expect(page.getByTestId('library-hero')).toContainText('путь героя.')
  await expect(page.getByTestId('library-topic')).toHaveCount(3)
  await expect(page.getByText('Программы', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Направленные записи', { exact: true })).toHaveCount(0)
  const screenshots = '/tmp/mentalix-library-screens'
  const settle = () =>
    page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(
        document
          .getAnimations()
          .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
          .map(animation => animation.finished.catch(() => {}))
      )
    })
  await mkdir(screenshots, { recursive: true })
  await settle()
  await page.screenshot({ path: `${screenshots}/home.png` })
  await page.getByTestId('library-hero').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await page.getByTestId('hero-map-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  const tile = page.getByTestId('library-article-tile').first()
  const tileBox = await tile.boundingBox()
  expect(tileBox.width).toBeGreaterThanOrEqual(44)
  expect(tileBox.height).toBeGreaterThanOrEqual(44)
  await tile.click()
  await expect(page.getByTestId('article-sheet')).toBeVisible()
  await settle()
  await page.screenshot({ path: `${screenshots}/sheet.png` })
  await page.getByTestId('article-sheet-backdrop').click({ position: { x: 10, y: 10 } })
  await expect(page.getByTestId('article-sheet')).toHaveCount(0)
  await tile.click()
  // Настоящий браузерный touch-жест вниз (Chromium), без вызова обработчиков.
  const sheetBox = await page.getByTestId('article-sheet').boundingBox()
  const touch = await page.context().newCDPSession(page)
  const x = sheetBox.x + sheetBox.width / 2
  const y = sheetBox.y + 10
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: y + sheetBox.height * 0.4 }],
  })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await touch.detach()
  await expect(page.getByTestId('article-sheet')).toHaveCount(0)
  await tile.click()
  await page.getByTestId('article-sheet-read').click()
  await expect(page.getByTestId('article-reader')).toBeVisible()
  await expect(page.getByTestId('article-title')).toHaveText('Путь героя: зачем кризис')
  await settle()
  await page.screenshot({ path: `${screenshots}/reader-start.png` })
  await page.getByTestId('article-reflection').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('article-reflection')).toContainText('А у тебя как?')
  await expect(page.getByTestId('article-next')).toContainText('Следующая статья →')
  await settle()
  await page.screenshot({ path: `${screenshots}/reader-end.png` })
  const readScroll = await page
    .locator('.mx-library-reader-surface .mx-fullscreen-scroll')
    .evaluate(el => el.scrollTop)
  await page.getByTestId('article-journal').click()
  // В демо новый журнал открывается сразу в настройке.
  await expect(page.getByTestId('article-reader')).toHaveCount(0)
  await expect(page.getByTestId('dj-setup-goal-0')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('article-reader')).toBeVisible()
  await expect
    .poll(() =>
      page.locator('.mx-library-reader-surface .mx-fullscreen-scroll').evaluate(el => el.scrollTop)
    )
    .toBe(readScroll)
  await page.getByTestId('article-next').click()
  await expect(page.getByTestId('article-title')).toHaveText('16 испытаний современного человека')
  await page.getByTestId('article-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  await expect(page.getByTestId('article-reader')).toHaveCount(0)
  const lastTile = page.getByTestId('library-article-tile').last()
  await lastTile.scrollIntoViewIfNeeded()
  const homeScroll = await page.getByTestId('app-scroll-root').evaluate(el => el.scrollTop)
  await lastTile.click()
  await page.getByTestId('article-sheet-read').click()
  await page.getByTestId('article-back').click()
  await expect
    .poll(() => page.getByTestId('app-scroll-root').evaluate(el => el.scrollTop))
    .toBe(homeScroll)
  for (const width of [320, 430, 789]) {
    await page.setViewportSize({ width, height: 932 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    const areas = await page
      .getByTestId('library-article-tile')
      .evaluateAll(els => els.map(el => ({ width: el.offsetWidth, height: el.offsetHeight })))
    expect(areas.every(area => area.width >= 44 && area.height >= 44)).toBe(true)
  }
  expect(errors).toEqual([])
})
