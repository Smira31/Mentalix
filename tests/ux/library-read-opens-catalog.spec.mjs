import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

// Один сквозной UX-сценарий; в CI используется общая конфигурация.
test('Библиотека: курс → разделы → шторка → чтение → журнал → следующая → назад', async ({
  page,
}) => {
  const screenshots = '/tmp/mentalix-library-screens'
  await mkdir(screenshots, { recursive: true })
  const geometry = async selector =>
    page.locator(selector).evaluate(el => {
      const frame = document.querySelector('[data-mentalix-demo-frame="true"]')
      const rect = el.getBoundingClientRect()
      const box = frame.getBoundingClientRect()
      const style = getComputedStyle(el)
      return {
        x: rect.x - box.x - frame.clientLeft,
        y: rect.y - box.y - frame.clientTop,
        width: rect.width,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        shellTop: getComputedStyle(frame).paddingTop,
      }
    })
  // Рамка 393/440 и демо-шапка обязательны: прежний frame=0 скрывал регрессию.
  await page.setViewportSize({ width: 1000, height: 1100 })
  for (const [device, width, safeTop] of [['standard', 393, 59], ['max', 440, 62]]) {
    const open = tab => page.goto(`/?demo=1&device=${device}&tab=${tab}`)
    await open('today')
    await expect(page.getByTestId('today-card-morning')).toBeVisible()
    const today = await geometry('.mx-tab-panel--active .mx-screen-shell')
    expect(today.x).toBe(0)
    expect(today.width).toBe(width - 16) // две стороны рамки по 8, не поля контента
    expect(today.paddingLeft).toBe('16px')
    expect(today.paddingRight).toBe('16px')
    expect(today.shellTop).toBe(`${safeTop + 56}px`)
    await open('practices')
    await expect(page.getByTestId('steps-search-open')).toBeVisible()
    const steps = await geometry('.mx-tab-panel--active .mx-practices-catalog-shell')
    expect(steps.width).toBe(today.width)
    expect(steps.x).toBe(today.x)
    expect(steps.shellTop).toBe(today.shellTop)
    const stepsTitle = await geometry('.mx-tab-panel--active h1')
    await open('library')
    await expect(page.getByTestId('library-home')).toBeVisible()
    const library = await geometry('[data-testid="library-home"]')
    expect(library).toMatchObject({ ...today, y: today.y })
    const title = await geometry('[data-testid="library-home"] h1')
    expect(title.x).toBe(16)
    // Высота строки заголовка отличается не больше одного токена (8).
    expect(Math.abs(title.y - stepsTitle.y)).toBeLessThanOrEqual(8)
    const chrome = await page.locator('.mx-demo-telegram-chrome__controls').boundingBox()
    const titleBox = await page.getByTestId('library-home').locator('h1').boundingBox()
    expect(titleBox.y).toBeGreaterThanOrEqual(chrome.y + chrome.height)
    await page.screenshot({ path: `${screenshots}/frame-${width}-home.png` })
    await page.getByTestId('library-hero').click()
    await expect(page.getByTestId('hero-journey-map')).toBeVisible()
    const course = await geometry('.mx-hero-journey .mx-screen__content')
    expect(course).toMatchObject({ x: 0, width: today.width, paddingLeft: '16px', paddingRight: '16px' })
    await page.screenshot({ path: `${screenshots}/frame-${width}-course.png` })
    await page.getByTestId('demo-chrome-back').click()
    await expect(page.getByTestId('library-home')).toBeVisible()
    await page.getByTestId('library-article-tile').first().click()
    await expect(page.getByTestId('article-sheet')).toBeVisible()
    const sheet = await geometry('[data-testid="article-sheet"]')
    expect(sheet.x).toBe(0)
    expect(sheet.width).toBe(today.width)
    expect(sheet.paddingLeft).toBe('16px')
    await page.screenshot({ path: `${screenshots}/frame-${width}-sheet.png` })
    await page.getByTestId('article-sheet-read').click()
    await expect(page.getByTestId('article-reader')).toBeVisible()
    const reader = await geometry('.mx-library-reader-surface .mx-screen__content')
    expect(reader).toMatchObject({ x: 0, width: today.width, paddingLeft: '16px', paddingRight: '16px' })
    const readerTitle = await geometry('[data-testid="article-title"]')
    expect(readerTitle.x).toBe(16)
    await page.screenshot({ path: `${screenshots}/frame-${width}-reader.png` })
    await page.getByTestId('demo-chrome-back').click()
    await expect(page.getByTestId('article-sheet')).toBeVisible()
    await page.getByTestId('demo-chrome-back').click()
    await expect(page.getByTestId('library-home')).toBeVisible()
    await open('today')
    await expect(page.getByTestId('today-card-morning')).toBeVisible()
    expect(await geometry('.mx-tab-panel--active .mx-screen-shell')).toEqual(today)
    await open('practices')
    await expect(page.getByTestId('steps-search-open')).toBeVisible()
    expect(await geometry('.mx-tab-panel--active .mx-practices-catalog-shell')).toEqual(steps)
  }
  await page.setViewportSize({ width: 430, height: 932 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?demo=1&tab=library&demo_courses=0')
  await expect(page.getByTestId('library-hero')).toContainText('путь героя.')
  await expect(page.getByTestId('library-topic')).toHaveCount(3)
  await expect(page.getByText('Программы', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Направленные записи', { exact: true })).toHaveCount(0)
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
  const belowChrome = async content => {
    const header = await content.boundingBox()
    const pill = await page.locator('.mx-demo-telegram-chrome__controls').boundingBox()
    expect(header.y).toBeGreaterThanOrEqual(pill.y + pill.height)
  }
  await mkdir(screenshots, { recursive: true })
  await settle()
  await belowChrome(page.getByTestId('library-home').locator('h1'))
  await page.screenshot({ path: `${screenshots}/home.png` })
  await page.getByTestId('library-hero').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await expect(page.getByTestId('demo-chrome-back')).toBeVisible()
  await expect(page.getByTestId('demo-chrome-back')).toHaveAccessibleName('Назад')
  await settle()
  await belowChrome(page.getByTestId('hero-journey-map').locator('.mx-hj-eyebrow'))
  await page.screenshot({ path: `${screenshots}/course.png` })
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  await expect(page.getByTestId('hero-journey-map')).toHaveCount(0)
  await page.getByTestId('library-hero').click()
  await page.getByTestId('hero-continue').click()
  await expect(page.getByTestId('hero-step-start')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('hero-journey-map')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  await expect(page.getByTestId('library-course-carousel')).toHaveCount(0)
  await page.goto('/?demo=1&tab=library')
  await expect(page.getByTestId('library-course-carousel')).toBeVisible()
  await expect(page.getByTestId('library-course-card')).toHaveCount(1)
  await expect(page.getByTestId('library-all-courses-open')).toHaveCount(0)
  await settle()
  await page.screenshot({ path: `${screenshots}/home-demo.png` })
  const carousel = page.getByTestId('library-course-carousel')
  const track = carousel.locator('.mx-tqc-track')
  const trackBox = await track.boundingBox()
  const swipe = await page.context().newCDPSession(page)
  await swipe.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: trackBox.x + trackBox.width * 0.85, y: trackBox.y + trackBox.height / 2 }],
  })
  await swipe.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: trackBox.x + trackBox.width * 0.15, y: trackBox.y + trackBox.height / 2 }],
  })
  await swipe.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await swipe.detach()
  await expect.poll(() => track.evaluate(el => el.scrollLeft)).toBeGreaterThan(0)
  await page.getByTestId('library-course-card').click()
  await expect(page.getByTestId('hero-journey-map')).toContainText('тихая опора.')
  await page.getByTestId('demo-chrome-back').click()
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
  await belowChrome(page.getByTestId('article-reader').locator('header .mx-library-caps'))
  await page.screenshot({ path: `${screenshots}/reader-start.png` })
  await page.getByTestId('article-reflection').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('article-reflection')).toContainText('А у тебя как?')
  await expect(page.getByTestId('article-next')).toContainText('Следующая статья')
  await settle()
  await page.screenshot({ path: `${screenshots}/reader-end.png` })
  const readScroll = await page
    .locator('.mx-library-reader-surface .mx-fullscreen-scroll')
    .evaluate(el => el.scrollTop)
  await page.getByTestId('article-journal').click()
  // В демо новый журнал открывается сразу в настройке.
  await expect(page.getByTestId('article-reader')).toHaveCount(0)
  await expect(page.getByTestId('dj-setup-goal-0')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('article-reader')).toBeVisible()
  await expect
    .poll(() =>
      page.locator('.mx-library-reader-surface .mx-fullscreen-scroll').evaluate(el => el.scrollTop)
    )
    .toBe(readScroll)
  await page.getByTestId('article-next').click()
  await expect(page.getByTestId('article-title')).toHaveText('16 испытаний современного человека')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('article-sheet')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  await expect(page.getByTestId('article-reader')).toHaveCount(0)
  const lastTile = page.getByTestId('library-article-tile').last()
  await lastTile.scrollIntoViewIfNeeded()
  const homeScroll = await page.getByTestId('app-scroll-root').evaluate(el => el.scrollTop)
  await lastTile.click()
  await page.getByTestId('article-sheet-read').click()
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('article-sheet')).toBeVisible()
  await page.getByTestId('demo-chrome-back').click()
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
  await page.goto('/?demo=1&tab=library&demo_courses=0')
  await page.getByTestId('library-hero').click()
  await page.getByTestId('hero-continue').click()
  await page.getByTestId('hero-step-start').click()
  await page.getByTestId('hero-write-input').fill('Сохранённый ответ курса')
  await page.getByTestId('hero-write-next').click()
  await page.getByTestId('hero-action-input').fill('Одно небольшое действие')
  await page.getByTestId('hero-action-next').click()
  await expect(page.getByTestId('hero-complete-map')).toBeVisible()
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('mx-hero-journey-progress:900001'))
  )
  expect(saved.completed.uncertainty).toBeTruthy()
  expect(saved.reflections.uncertainty).toBe('Сохранённый ответ курса')
  await page.reload()
  await expect(page.getByTestId('library-hero')).toContainText('Шаг 2 из 16')
  await page.getByTestId('library-hero').click()
  await expect(page.getByTestId('hero-journey-map')).toContainText('Пройдено 1 из 16')
  await page.getByTestId('demo-chrome-back').click()
  await expect(page.getByTestId('library-home')).toBeVisible()
  expect(errors).toEqual([])
})
