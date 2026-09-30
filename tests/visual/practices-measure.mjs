/*
 * Замеры экранов «Твои практики» и «Библиотека практик» против эталона Stoic.
 *
 * Запуск: node tests/visual/practices-measure.mjs [baseURL]
 *   baseURL — по умолчанию http://localhost:5173 (vite dev в контейнере).
 *   Скриншоты пишутся в /tmp/practices-measure/.
 *
 * Проверяет геометрию обоих экранов (эталон / факт / разница, допуск ±2pt)
 * при ширине 393 и 440, в web и Telegram-режиме.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = '/tmp/practices-measure'
mkdirSync(OUT, { recursive: true })

const round = v => (v == null ? null : Math.round(v * 10) / 10)

// ── Эталон Stoic (pt = CSS px) ──
// Ширина карточки = (sheetWidth - 16*2 - 8) / 2 — сетка 2 колонки, gap 8.
const manageCardW = viewportW => Math.round(((Math.min(viewportW, 440) - 40) / 2) * 10) / 10
const TARGET_MANAGE = {
  cardH: 253,
  icon: 68,
  iconSvg: 40,
  cols: 2,
  pillH: 52,
  pillCount: 2,
}

const TARGET_LIBRARY = {
  saveBtn: 39,
  titleFontSize: 28,
  titleFontWeight: 700,
  chipH: 41,
  rowH: 63,
  rowIcon: 35,
  rowNameFontSize: 16,
  rowNameFontWeight: 600,
  toggle: 21,
  searchW: 342,
  searchH: 49,
}

const TG_INIT_SCRIPT = `
  const handlers = new Set()
  const button = {
    isVisible: false,
    show() { this.isVisible = true },
    hide() { this.isVisible = false },
    onClick(handler) { handlers.add(handler) },
    offClick(handler) { handlers.delete(handler) },
  }
  window.__telegramBackClick = () => [...handlers].at(-1)?.()
  const webApp = {
    initData: 'query_id=measure&user=%7B%22id%22%3A900002%7D',
    initDataUnsafe: { user: { id: 900002, first_name: 'M' } },
    version: '8.0',
    platform: 'ios',
    colorScheme: 'dark',
    isFullscreen: true,
    isVersionAtLeast: ver => '8.0' >= ver,
    BackButton: button,
    MainButton: { setParams() {}, onClick() {}, offClick() {}, show() {}, hide() {}, enable() {}, disable() {}, showProgress() {}, hideProgress() {} },
    SecondaryButton: { setParams() {}, onClick() {}, offClick() {}, show() {}, hide() {} },
    onEvent() {},
    offEvent() {},
    ready() {},
    expand() {},
    requestFullscreen() {},
    lockOrientation() {},
    disableVerticalSwipes() {},
    HapticFeedback: { impactOccurred() {}, notificationOccurred() {} },
    safeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
    contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0 },
  }
  window.Telegram = { WebApp: webApp }
  Object.defineProperty(window.Telegram, 'WebApp', {
    configurable: true,
    get() { return webApp },
    set() {},
  })
`

async function openSheet(page, action) {
  await page.goto(`${BASE}/?demo=1&action=${action}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
}

async function measureManage(page) {
  return page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const rect = sel => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) }
    }
    const grid = document.querySelector('.mx-pinned-practices__grid')
    const cards = [...document.querySelectorAll('.mx-pinned-practices__grid .mx-pinned-practice-card')]
    const firstCard = cards[0]?.getBoundingClientRect()
    const icon = document.querySelector('.mx-pinned-practices__grid .mx-pinned-practice-glyph')?.getBoundingClientRect()
    const iconSvg = document.querySelector('.mx-pinned-practices__grid .mx-pinned-practice-glyph svg')?.getBoundingClientRect()
    const pills = [...document.querySelectorAll('.mx-pinned-sheet__pill')]
    const gridStyle = grid ? getComputedStyle(grid) : null
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      cols: gridStyle?.gridTemplateColumns?.split(' ').length ?? null,
      cardW: firstCard ? round(firstCard.width) : null,
      cardH: firstCard ? round(firstCard.height) : null,
      iconW: icon ? round(icon.width) : null,
      iconSvgW: iconSvg ? round(iconSvg.width) : null,
      pillCount: pills.length,
      pillH: pills[0] ? round(pills[0].getBoundingClientRect().height) : null,
    }
  })
}

async function measureLibrary(page) {
  return page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const rect = sel => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) }
    }
    const saveBtn = document.querySelector('.mx-pinned-sheet__save')
    const title = document.querySelector('.mx-pinned-sheet__title--left')
    const titleStyle = title ? getComputedStyle(title) : null
    const chips = [...document.querySelectorAll('.mx-library-chip')]
    const rows = [...document.querySelectorAll('.mx-library-row')]
    const firstRow = rows[0]?.getBoundingClientRect()
    const rowIcon = document.querySelector('.mx-library-row__icon')?.getBoundingClientRect()
    const rowName = document.querySelector('.mx-library-row__name')
    const rowNameStyle = rowName ? getComputedStyle(rowName) : null
    const toggle = document.querySelector('.mx-library-row__toggle')?.getBoundingClientRect()
    const search = document.querySelector('.mx-library-search')?.getBoundingClientRect()
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      saveBtnW: saveBtn ? round(saveBtn.getBoundingClientRect().width) : null,
      saveBtnH: saveBtn ? round(saveBtn.getBoundingClientRect().height) : null,
      titleFontSize: titleStyle ? parseFloat(titleStyle.fontSize) : null,
      titleFontWeight: titleStyle ? titleStyle.fontWeight : null,
      titleAlign: titleStyle ? titleStyle.textAlign : null,
      chipH: chips[0] ? round(chips[0].getBoundingClientRect().height) : null,
      chipCount: chips.length,
      rowH: firstRow ? round(firstRow.height) : null,
      rowIconW: rowIcon ? round(rowIcon.width) : null,
      rowNameFontSize: rowNameStyle ? parseFloat(rowNameStyle.fontSize) : null,
      rowNameFontWeight: rowNameStyle ? rowNameStyle.fontWeight : null,
      toggleW: toggle ? round(toggle.width) : null,
      searchW: search ? round(search.width) : null,
      searchH: search ? round(search.height) : null,
    }
  })
}

async function runWeb(name, width, height) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()

  // ── Manage ──
  await openSheet(page, 'practices_manage')
  const manage = await measureManage(page)
  await page.screenshot({ path: `${OUT}/${name}-manage.png` })

  // ── Library (открыть из manage через кнопку «Добавить из библиотеки») ──
  await page.locator('.mx-pinned-sheet__pill').last().click()
  await page.waitForTimeout(1500)
  const library = await measureLibrary(page)
  await page.screenshot({ path: `${OUT}/${name}-library.png` })

  await browser.close()
  return { manage, library }
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

  // ── Manage ──
  await openSheet(page, 'practices_manage')
  const manage = await measureManage(page)
  const manageTg = await page.evaluate(() => ({
    closeBtn: Boolean(document.querySelector('.mx-pinned-sheet__header-top button')),
    sheetPaddingTop: getComputedStyle(document.querySelector('.mx-pinned-sheet')).paddingTop,
    footerPaddingBottom: getComputedStyle(document.querySelector('.mx-pinned-sheet__footer')).paddingBottom,
  }))
  await page.screenshot({ path: `${OUT}/${name}-manage.png` })

  // ── Library ──
  await page.locator('.mx-pinned-sheet__pill').last().click()
  await page.waitForTimeout(1500)
  const library = await measureLibrary(page)
  const libraryTg = await page.evaluate(() => ({
    saveBtn: Boolean(document.querySelector('.mx-pinned-sheet__save')),
    sheetPaddingTop: getComputedStyle(document.querySelector('.mx-pinned-sheet')).paddingTop,
    bodyPaddingBottom: getComputedStyle(document.querySelector('.mx-pinned-sheet--library .mx-pinned-sheet__body')).paddingBottom,
  }))
  await page.screenshot({ path: `${OUT}/${name}-library.png` })

  await browser.close()
  return { manage, library, manageTg, libraryTg }
}

const results = {}
results['web-440'] = await runWeb('web-440', 440, 900)
results['web-393'] = await runWeb('web-393', 393, 852)
results['tg-440'] = await runTelegram('tg-440', 440, 900)
results['tg-393'] = await runTelegram('tg-393', 393, 852)

function tableRow(label, target, actual) {
  const diff = actual == null ? '—' : round(actual - target)
  const ok = actual == null ? '—' : Math.abs(actual - target) <= 2 ? '✓' : '✗'
  console.log(`  ${label.padEnd(36)} | ${String(target).padStart(6)} | ${String(actual ?? '—').padStart(6)} | ${String(diff).padStart(6)} | ${ok}`)
}

function printManageTable(name, data) {
  const vw = data.viewport.w
  console.log(`\n=== «Твои практики» — ${name} (эталон / факт / разница, допуск ±2) ===`)
  console.log(`  ${'Параметр'.padEnd(36)} | ${'эталон'.padStart(6)} | ${'факт'.padStart(6)} | ${'Δ'.padStart(6)} | ok`)
  tableRow('колонок в сетке', TARGET_MANAGE.cols, data.cols)
  tableRow('ширина карточки', manageCardW(vw), data.cardW)
  tableRow('высота карточки', TARGET_MANAGE.cardH, data.cardH)
  tableRow('круг-иконка (диаметр)', TARGET_MANAGE.icon, data.iconW)
  tableRow('svg внутри иконки', TARGET_MANAGE.iconSvg, data.iconSvgW)
  tableRow('пилюль внизу (кол-во)', TARGET_MANAGE.pillCount, data.pillCount)
  tableRow('высота пилюли', TARGET_MANAGE.pillH, data.pillH)
}

function printLibraryTable(name, data) {
  console.log(`\n=== «Библиотека практик» — ${name} (эталон / факт / разница, допуск ±2) ===`)
  console.log(`  ${'Параметр'.padEnd(36)} | ${'эталон'.padStart(6)} | ${'факт'.padStart(6)} | ${'Δ'.padStart(6)} | ok`)
  tableRow('кнопка ✓ (ширина)', TARGET_LIBRARY.saveBtn, data.saveBtnW)
  tableRow('кнопка ✓ (высота)', TARGET_LIBRARY.saveBtn, data.saveBtnH)
  tableRow('заголовок font-size', TARGET_LIBRARY.titleFontSize, data.titleFontSize)
  tableRow('заголовок font-weight', TARGET_LIBRARY.titleFontWeight, data.titleFontWeight == null ? null : Number(data.titleFontWeight))
  tableRow('чипс высота', TARGET_LIBRARY.chipH, data.chipH)
  tableRow('чипсов (кол-во)', 2, data.chipCount)
  tableRow('строка высота', TARGET_LIBRARY.rowH, data.rowH)
  tableRow('круг-иконка строки (диаметр)', TARGET_LIBRARY.rowIcon, data.rowIconW)
  tableRow('название font-size', TARGET_LIBRARY.rowNameFontSize, data.rowNameFontSize)
  tableRow('название font-weight', TARGET_LIBRARY.rowNameFontWeight, data.rowNameFontWeight == null ? null : Number(data.rowNameFontWeight))
  tableRow('кружок-галочка (диаметр)', TARGET_LIBRARY.toggle, data.toggleW)
  tableRow('поиск ширина', TARGET_LIBRARY.searchW, data.searchW)
  tableRow('поиск высота', TARGET_LIBRARY.searchH, data.searchH)
}

printManageTable('web-440', results['web-440'].manage)
printManageTable('web-393', results['web-393'].manage)
printManageTable('tg-440', results['tg-440'].manage)
printManageTable('tg-393', results['tg-393'].manage)

printLibraryTable('web-440', results['web-440'].library)
printLibraryTable('web-393', results['web-393'].library)
printLibraryTable('tg-440', results['tg-440'].library)
printLibraryTable('tg-393', results['tg-393'].library)

console.log('\n=== Telegram-проверки ===')
for (const [name, r] of Object.entries(results)) {
  if (!r.manageTg) continue
  console.log(`\n--- ${name} ---`)
  console.log('  Manage: кнопка закрытия скрыта (ожидание false):', !r.manageTg.closeBtn)
  console.log('  Manage: paddingTop шапки (safe-area):', r.manageTg.sheetPaddingTop)
  console.log('  Manage: paddingBottom футера (safe-area):', r.manageTg.footerPaddingBottom)
  console.log('  Library: кнопка ✓ скрыта (ожидание false):', !r.libraryTg.saveBtn)
  console.log('  Library: paddingTop шапки (safe-area):', r.libraryTg.sheetPaddingTop)
  console.log('  Library: paddingBottom body (safe-area):', r.libraryTg.bodyPaddingBottom)
}
