/*
 * Замеры вкладки «Статистика» против эталона Stoic Stats (393pt и 440pt).
 *
 * Запуск: node tests/visual/stats-measure.mjs [baseURL]
 *   baseURL — по умолчанию http://localhost:5173 (vite dev в контейнере).
 *   Скриншоты пишутся в /tmp/stats-measure/.
 *
 * Проверяет:
 *   2. Плитки сверху: 2 ряда, листаются вбок, плитка min(399,100%)×79pt,
 *      радиус 16, фон card2, число 28/700 cream, подпись 13/400 muted.
 *   3. Разделы: подпись по центру, Manrope 13/700, заглавные, разрядка 0.2em,
 *      muted, 40pt над разделом, 12 под подписью.
 *   4. Карточки разделов: радиус 16, фон card2, БЕЗ разделителей,
 *      строка 34.5pt, поля 16, слева 15/400 cream, справа 17/700 cream.
 *   5. Контент уходит под плавающий сегмент и ✕ без серой плашки,
 *      низ списка достижим.
 *
 * Таблица «эталон / у нас / Δ» (±2pt) — 393 и 440, web + Telegram-режим.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = '/tmp/stats-measure'
mkdirSync(OUT, { recursive: true })

const round = v => Math.round(v * 10) / 10
const TOL = 2 // ±2pt

// Эталон Stoic Stats — плитки (на 440pt; на 393 — ширина экрана − 2×16 = 361)
const TARGET_TILE_440 = { w: 399, h: 79, radius: 16, numSize: 28, numWeight: 700, labelSize: 13, labelWeight: 400 }
const TARGET_TILE_393 = { w: 361, h: 79, radius: 16, numSize: 28, numWeight: 700, labelSize: 13, labelWeight: 400 }

// Эталон Stoic Stats — разделы
const TARGET_SECTION = { headerSize: 13, headerWeight: 700, headerSpacing: '0.2em', headerTransform: 'uppercase', headerAlign: 'center', marginTop: 40, marginBottom: 12 }

// Эталон Stoic Stats — карточки разделов
const TARGET_CARD = { radius: 16, rowH: 34.5, paddingX: 16, leftSize: 15, leftWeight: 400, rightSize: 17, rightWeight: 700, hasDivider: false }

const TG_INIT_SCRIPT = `
  const handlers = new Set()
  const button = {
    isVisible: false, show() { this.isVisible = true }, hide() { this.isVisible = false },
    onClick(h) { handlers.add(h) }, offClick(h) { handlers.delete(h) },
  }
  window.__telegramBackClick = () => [...handlers].at(-1)?.()
  const webApp = {
    initData: 'query_id=measure&user=%7B%22id%22%3A900002%7D',
    initDataUnsafe: { user: { id: 900002, first_name: 'M' } },
    version: '8.0', platform: 'ios', colorScheme: 'dark', isFullscreen: true,
    isVersionAtLeast: ver => '8.0' >= ver,
    BackButton: button,
    MainButton: { setParams() {}, onClick() {}, offClick() {}, show() {}, hide() {}, enable() {}, disable() {}, showProgress() {}, hideProgress() {} },
    SecondaryButton: { setParams() {}, onClick() {}, offClick() {}, show() {}, hide() {} },
    onEvent() {}, offEvent() {}, ready() {}, expand() {}, requestFullscreen() {}, lockOrientation() {},
    disableVerticalSwipes() {},
    HapticFeedback: { impactOccurred() {}, notificationOccurred() {} },
    safeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
    contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
  }
  window.Telegram = { WebApp: webApp }
  Object.defineProperty(window.Telegram, 'WebApp', { configurable: true, get() { return webApp }, set() {} })
`

async function openStats(page) {
  await page.goto(`${BASE}/?demo=1`, { waitUntil: 'domcontentloaded' })
  await page.getByTestId('today-streak-chip').click()
  await page.getByTestId('series-tab-badges').waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(2500)
  await page.getByTestId('series-tab-stats').click()
  await page.waitForSelector('.mx-path-tile', { state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(500)
}

async function measureStats(page) {
  return page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const cs = el => el ? getComputedStyle(el) : null

    // Плитки
    const tilesEl = document.querySelector('.mx-path-tiles')
    const tileFirst = document.querySelector('.mx-path-tile')
    const tileRect = tileFirst?.getBoundingClientRect()
    const tileStyle = cs(tileFirst)
    const tileNum = tileFirst?.querySelector('strong')
    const tileLabel = tileFirst?.querySelector('span')
    const tileNumStyle = cs(tileNum)
    const tileLabelStyle = cs(tileLabel)
    const tileCount = document.querySelectorAll('.mx-path-tile').length
    const tilesScroll = tilesEl ? { scrollW: tilesEl.scrollWidth, clientW: tilesEl.clientWidth, overflowX: cs(tilesEl).overflowX } : null

    // Разделы
    const section = document.querySelector('.mx-path-stat-section')
    const sectionStyle = cs(section)
    const header = section?.querySelector('h2')
    const headerStyle = cs(header)
    const headerRect = header?.getBoundingClientRect()
    const sectionRect = section?.getBoundingClientRect()

    // Карточки разделов
    const card = document.querySelector('.mx-path-stat-card')
    const cardStyle = cs(card)
    const cardRect = card?.getBoundingClientRect()
    const rowFirst = document.querySelector('.mx-path-stat-row')
    const rowStyle = cs(rowFirst)
    const rowRect = rowFirst?.getBoundingClientRect()
    const rowLeft = rowFirst?.querySelector('span')
    const rowRight = rowFirst?.querySelector('strong')
    const rowLeftStyle = cs(rowLeft)
    const rowRightStyle = cs(rowRight)
    // Проверка отсутствия разделителей
    const allRows = document.querySelectorAll('.mx-path-stat-row')
    const hasAnyDivider = [...allRows].some(r => cs(r).borderBottomStyle !== 'none' && cs(r).borderBottomWidth !== '0px')

    // Шапка (прозрачность)
    const headerBar = document.querySelector('.mx-path-scroll--overlay .mx-path-header')
    const headerBarStyle = cs(headerBar)

    // Низ списка достижим
    const scrollEl = document.querySelector('.mx-path-scroll--overlay')

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      tile: {
        w: tileRect ? round(tileRect.width) : null,
        h: tileRect ? round(tileRect.height) : null,
        radius: tileStyle ? parseFloat(tileStyle.borderRadius) : null,
        numSize: tileNumStyle ? parseFloat(tileNumStyle.fontSize) : null,
        numWeight: tileNumStyle ? tileNumStyle.fontWeight : null,
        labelSize: tileLabelStyle ? parseFloat(tileLabelStyle.fontSize) : null,
        labelWeight: tileLabelStyle ? tileLabelStyle.fontWeight : null,
        count: tileCount,
      },
      tilesScroll,
      section: {
        marginTop: sectionStyle ? parseFloat(sectionStyle.marginTop) : null,
        headerSize: headerStyle ? parseFloat(headerStyle.fontSize) : null,
        headerWeight: headerStyle ? headerStyle.fontWeight : null,
        headerFamily: headerStyle ? headerStyle.fontFamily : null,
        headerSpacing: headerStyle ? headerStyle.letterSpacing : null,
        headerTransform: headerStyle ? headerStyle.textTransform : null,
        headerAlign: headerStyle ? headerStyle.textAlign : null,
        marginBottom: headerStyle ? parseFloat(headerStyle.marginBottom) : null,
      },
      card: {
        radius: cardStyle ? parseFloat(cardStyle.borderRadius) : null,
        rowH: rowRect ? round(rowRect.height) : null,
        paddingX: rowStyle ? parseFloat(rowStyle.paddingLeft) : null,
        leftSize: rowLeftStyle ? parseFloat(rowLeftStyle.fontSize) : null,
        leftWeight: rowLeftStyle ? rowLeftStyle.fontWeight : null,
        rightSize: rowRightStyle ? parseFloat(rowRightStyle.fontSize) : null,
        rightWeight: rowRightStyle ? rowRightStyle.fontWeight : null,
        hasDivider: hasAnyDivider,
      },
      headerBar: {
        bg: headerBarStyle ? headerBarStyle.backgroundColor : null,
      },
      scroll: scrollEl ? { scrollHeight: scrollEl.scrollHeight, clientHeight: scrollEl.clientHeight } : null,
    }
  })
}

function printTable(label, target, actual, width) {
  const pass = (a, b) => (a != null && b != null && Math.abs(a - b) <= TOL ? '✓' : '✗')
  console.log(`\n=== ${label} (${width}px) — эталон / у нас / Δ (±${TOL}pt) ===`)
  console.log('Параметр                           | Эталон | У нас  | Δ     |')
  console.log('----------------------------------|--------|--------|-------|')
  const fmt = (name, t, a) => {
    const delta = a == null ? '—' : (typeof t === 'number' && typeof a === 'number' ? round(a - t) : String(a))
    const ok = typeof t === 'number' && typeof a === 'number' ? pass(a, t) : ''
    console.log(`${name.padEnd(34)}| ${String(t).padEnd(7)}| ${String(a ?? '—').padEnd(7)}| ${String(delta).padEnd(6)}${ok}`)
  }
  if (target.tile) {
    fmt('Плитка: ширина (pt)', target.tile.w, actual.tile?.w)
    fmt('Плитка: высота (pt)', target.tile.h, actual.tile?.h)
    fmt('Плитка: радиус (pt)', target.tile.radius, actual.tile?.radius)
    fmt('Плитка: число size (pt)', target.tile.numSize, actual.tile?.numSize)
    fmt('Плитка: число weight', target.tile.numWeight, actual.tile?.numWeight)
    fmt('Плитка: подпись size (pt)', target.tile.labelSize, actual.tile?.labelSize)
    fmt('Плитка: подпись weight', target.tile.labelWeight, actual.tile?.labelWeight)
    console.log(`Плитки: кол-во (факт ${actual.tile?.count}), скролл ${actual.tilesScroll?.scrollW > actual.tilesScroll?.clientW ? 'есть' : 'нет'}`)
  }
  if (target.section) {
    fmt('Раздел: заголовок size (pt)', target.section.headerSize, actual.section?.headerSize)
    fmt('Раздел: заголовок weight', target.section.headerWeight, actual.section?.headerWeight)
    fmt('Раздел: margin-top (pt)', target.section.marginTop, actual.section?.marginTop)
    fmt('Раздел: margin-bottom (pt)', target.section.marginBottom, actual.section?.marginBottom)
    console.log(`Раздел: font-family (эталон Manrope): ${actual.section?.headerFamily?.includes('Manrope') ? '✓' : '✗'} (${actual.section?.headerFamily})`)
    const lsPx = parseFloat(actual.section?.headerSpacing)
    const lsExpected = 0.2 * actual.section?.headerSize
    console.log(`Раздел: letter-spacing (эталон 0.2em = ${round(lsExpected)}px): ${Math.abs(lsPx - lsExpected) <= 0.5 ? '✓' : '✗'} (${actual.section?.headerSpacing})`)
    console.log(`Раздел: text-transform (эталон ${target.section.headerTransform}): ${actual.section?.headerTransform === target.section.headerTransform ? '✓' : '✗'} (${actual.section?.headerTransform})`)
    console.log(`Раздел: text-align (эталон ${target.section.headerAlign}): ${actual.section?.headerAlign === target.section.headerAlign ? '✓' : '✗'} (${actual.section?.headerAlign})`)
  }
  if (target.card) {
    fmt('Карточка: радиус (pt)', target.card.radius, actual.card?.radius)
    fmt('Карточка: высота строки (pt)', target.card.rowH, actual.card?.rowH)
    fmt('Карточка: поля (pt)', target.card.paddingX, actual.card?.paddingX)
    fmt('Карточка: лево size (pt)', target.card.leftSize, actual.card?.leftSize)
    fmt('Карточка: лево weight', target.card.leftWeight, actual.card?.leftWeight)
    fmt('Карточка: право size (pt)', target.card.rightSize, actual.card?.rightSize)
    fmt('Карточка: право weight', target.card.rightWeight, actual.card?.rightWeight)
    console.log(`Карточка: разделители (эталон нет): ${actual.card?.hasDivider ? '✗ ЕСТЬ' : '✓ нет'}`)
  }
  console.log(`Шапка фон (эталон transparent): ${actual.headerBar?.bg === 'rgba(0, 0, 0, 0)' ? '✓' : '✗'} (${actual.headerBar?.bg})`)
  console.log(`Низ списка достижим: scrollHeight ${actual.scroll?.scrollHeight} > clientHeight ${actual.scroll?.clientHeight} → ${actual.scroll && actual.scroll.scrollHeight > actual.scroll.clientHeight ? '✓ скролл есть' : 'нет'}`)
}

async function runWeb(name, width, height, mobile) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: mobile,
    isMobile: mobile,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await openStats(page)
  const data = await measureStats(page)
  await page.screenshot({ path: `${OUT}/${name}.png` })

  // Проверка скролла до конца
  await page.evaluate(() => {
    const el = document.querySelector('.mx-path-scroll--overlay')
    el.scrollTop = el.scrollHeight
  })
  await page.waitForTimeout(300)
  const bottom = await page.evaluate(() => {
    const el = document.querySelector('.mx-path-scroll--overlay')
    return { fully: el.scrollTop + el.clientHeight >= el.scrollHeight - 2 }
  })
  await page.screenshot({ path: `${OUT}/${name}-bottom.png` })
  await browser.close()
  return { data, bottom, width }
}

async function runTelegram(name, width, height) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  await context.addInitScript(TG_INIT_SCRIPT)
  const page = await context.newPage()
  await openStats(page)
  const data = await measureStats(page)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await browser.close()
  return { data, width }
}

const targetFor = width => ({
  tile: width >= 440 ? TARGET_TILE_440 : TARGET_TILE_393,
  section: TARGET_SECTION,
  card: TARGET_CARD,
})

console.log('=== Замеры вкладки «Статистика» — Stoic Stats ===\n')

const web440 = await runWeb('web-440', 440, 900, false)
const web393 = await runWeb('web-393', 393, 852, true)
const tg440 = await runTelegram('tg-440', 440, 900)
const tg393 = await runTelegram('tg-393', 393, 852)

printTable('Web 440px', targetFor(440), web440.data, 440)
printTable('Web 393px', targetFor(393), web393.data, 393)
printTable('Telegram 440px', targetFor(440), tg440.data, 440)
printTable('Telegram 393px', targetFor(393), tg393.data, 393)

console.log('\n=== Скролл до конца ===')
console.log(`Web 440: ${web440.bottom.fully ? '✓' : '✗'}`)
console.log(`Web 393: ${web393.bottom.fully ? '✓' : '✗'}`)
