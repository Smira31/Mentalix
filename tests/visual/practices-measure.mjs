/*
 * Замеры экранов «Твои практики» и «Библиотека практик» против эталона Stoic.
 *
 * Запуск: node tests/visual/practices-measure.mjs [baseURL]
 *   baseURL — по умолчанию http://localhost:5173 (vite dev в контейнере).
 *   Скриншоты пишутся в /tmp/practices-measure/.
 *
 * Эталон снят на iPhone 16 Pro Max (440pt), размеры — pt (= CSS px).
 * От ширины экрана зависит только ширина карточки в сетке «твоих практик»
 * (две колонки, поля 16, зазор 7), поэтому одни и те же эталоны проверяются
 * при 440 и 393, в web и Telegram-режиме. Допуск ±2pt.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = '/tmp/practices-measure'
mkdirSync(OUT, { recursive: true })

const round = v => (v == null ? null : Math.round(v * 10) / 10)

// ── Эталон Stoic (pt = CSS px, 440pt) ──
// Ширина карточки = (sheetWidth − поля 16×2 − зазор 7) / 2 — сетка 2 колонки.
const manageCardW = viewportW => round((Math.min(viewportW, 440) - 16 * 2 - 7) / 2)

const TARGET_MANAGE = {
  cols: 2,
  gap: 7,
  cardH: 284,
  icon: 76,
  iconSvg: 45,
  close: 43,
  more: 25,
  titleFontSize: 24,
  titleFontWeight: 700,
  titleColor: 'rgb(214, 214, 214)',
  subtitleFontSize: 15,
  pillCount: 2,
  pillW: 280,
  pillH: 55,
  pillGap: 10,
  pillBottom: 43,
}

const TARGET_LIBRARY = {
  save: 43,
  titleFontSize: 30,
  titleFontWeight: 700,
  titleLeft: 21,
  chipH: 46,
  chipGap: 8,
  chipFontSize: 15,
  rowH: 70,
  rowIcon: 39,
  rowNameFontSize: 16,
  rowNameFontWeight: 600,
  rowNameColor: 'rgb(214, 214, 214)',
  dividerLeft: 51,
  toggle: 24,
  searchW: 383,
  searchH: 49,
  searchBottom: 28,
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
    const grid = document.querySelector('.mx-pinned-practices__grid')
    const gridStyle = grid ? getComputedStyle(grid) : null
    const cards = [...document.querySelectorAll('.mx-pinned-practices__grid .mx-pinned-practice-card')]
    const firstCard = cards[0]?.getBoundingClientRect()
    const icon = document.querySelector('.mx-pinned-practices__grid .mx-pinned-practice-glyph')?.getBoundingClientRect()
    const iconSvg = document.querySelector('.mx-pinned-practices__grid .mx-pinned-practice-glyph svg')?.getBoundingClientRect()
    const more = document.querySelector('.mx-pinned-practice-card__more')?.getBoundingClientRect()
    const close = document.querySelector('.mx-pinned-sheet__header-top .mx-pinned-sheet__circle')?.getBoundingClientRect()
    const title = document.querySelector('.mx-pinned-sheet__header > h2')
    const titleStyle = title ? getComputedStyle(title) : null
    const subtitle = document.querySelector('.mx-pinned-sheet__subtitle')
    const subtitleStyle = subtitle ? getComputedStyle(subtitle) : null
    const pills = [...document.querySelectorAll('.mx-pinned-sheet__pill')]
    const pillRects = pills.map(pill => pill.getBoundingClientRect())
    const lastPill = pillRects.at(-1)
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      cols: gridStyle?.gridTemplateColumns?.split(' ').length ?? null,
      gap: gridStyle ? round(parseFloat(gridStyle.gap)) : null,
      cardW: firstCard ? round(firstCard.width) : null,
      cardH: firstCard ? round(firstCard.height) : null,
      iconW: icon ? round(icon.width) : null,
      iconSvgW: iconSvg ? round(iconSvg.width) : null,
      moreW: more ? round(more.width) : null,
      closeW: close ? round(close.width) : null,
      titleFontSize: titleStyle ? parseFloat(titleStyle.fontSize) : null,
      titleFontWeight: titleStyle ? titleStyle.fontWeight : null,
      titleColor: titleStyle ? titleStyle.color : null,
      subtitleFontSize: subtitleStyle ? parseFloat(subtitleStyle.fontSize) : null,
      pillCount: pills.length,
      pillW: pillRects[0] ? round(pillRects[0].width) : null,
      pillH: pillRects[0] ? round(pillRects[0].height) : null,
      pillGap:
        pillRects.length > 1
          ? round(pillRects[1].y - (pillRects[0].y + pillRects[0].height))
          : null,
      pillBottom: lastPill ? round(window.innerHeight - lastPill.bottom) : null,
    }
  })
}

// Карточки должны прокручиваться под пилюлями и не быть ими отрезаны.
async function probeManageScroll(page) {
  return page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const body = document.querySelector('.mx-pinned-sheet__body')
    body.scrollTop = body.scrollHeight
    const card = [
      ...document.querySelectorAll('.mx-pinned-practices__grid .mx-pinned-practice-card'),
    ].at(-1)
    const pill = document.querySelector('.mx-pinned-sheet__pill')
    const cardRect = card?.getBoundingClientRect()
    const pillRect = pill?.getBoundingClientRect()
    return {
      scrollable: body.scrollHeight > body.clientHeight,
      reachedBottom: body.scrollTop + body.clientHeight >= body.scrollHeight - 1,
      lastCardGapToPills:
        cardRect && pillRect ? round(pillRect.top - cardRect.bottom) : null,
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
    const sheet = document.querySelector('.mx-pinned-sheet')
    const save = document.querySelector('.mx-pinned-sheet__header-top .mx-pinned-sheet__circle')
    const title = document.querySelector('.mx-pinned-sheet__title--left')
    const titleStyle = title ? getComputedStyle(title) : null
    const titleLeft =
      title && sheet ? round(title.getBoundingClientRect().x - sheet.getBoundingClientRect().x) : null
    const chips = [...document.querySelectorAll('.mx-library-chip')]
    const chipStyle = chips[0] ? getComputedStyle(chips[0]) : null
    const filtersStyle = getComputedStyle(document.querySelector('.mx-library-filters'))
    const rows = [...document.querySelectorAll('.mx-library-row')]
    const firstRow = rows[0]
    const firstRowStyle = firstRow ? getComputedStyle(firstRow) : null
    const rowIcon = document.querySelector('.mx-library-row__icon')?.getBoundingClientRect()
    const rowName = document.querySelector('.mx-library-row__name')
    const rowNameStyle = rowName ? getComputedStyle(rowName) : null
    const toggle = document.querySelector('.mx-library-row__toggle:not(.is-pinned)')?.getBoundingClientRect()
    const pinnedToggle = document.querySelector('.mx-library-row__toggle.is-pinned')?.getBoundingClientRect()
    const search = document.querySelector('.mx-library-search')?.getBoundingClientRect()
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      saveBtnW: save ? round(save.getBoundingClientRect().width) : null,
      saveBtnH: save ? round(save.getBoundingClientRect().height) : null,
      titleFontSize: titleStyle ? parseFloat(titleStyle.fontSize) : null,
      titleFontWeight: titleStyle ? titleStyle.fontWeight : null,
      titleAlign: titleStyle ? titleStyle.textAlign : null,
      titleLeft,
      chipH: chips[0] ? round(chips[0].getBoundingClientRect().height) : null,
      chipCount: chips.length,
      chipGap: round(parseFloat(filtersStyle.gap)),
      chipFontSize: chipStyle ? parseFloat(chipStyle.fontSize) : null,
      rowH: firstRow ? round(firstRow.getBoundingClientRect().height) : null,
      rowCount: rows.length,
      rowIconW: rowIcon ? round(rowIcon.width) : null,
      rowNameFontSize: rowNameStyle ? parseFloat(rowNameStyle.fontSize) : null,
      rowNameFontWeight: rowNameStyle ? rowNameStyle.fontWeight : null,
      rowNameColor: rowNameStyle ? rowNameStyle.color : null,
      dividerLeft: firstRowStyle ? round(parseFloat(getComputedStyle(firstRow, '::after').left)) : null,
      toggleW: toggle ? round(toggle.width) : null,
      pinnedToggleW: pinnedToggle ? round(pinnedToggle.width) : null,
      searchW: search ? round(search.width) : null,
      searchH: search ? round(search.height) : null,
      searchBottom: search ? round(window.innerHeight - search.bottom) : null,
    }
  })
}

// БАГ: при тапе вокруг строки появлялась белая рамка. Тапаем по строке
// и читаем outline + подсветку тапа (ожидание: рамки нет).
async function probeTapOutline(page) {
  await page.locator('.mx-library-row').first().click()
  await page.waitForTimeout(250)
  return page.evaluate(() => {
    const el = document.querySelector('.mx-library-row')
    const style = getComputedStyle(el)
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      tapHighlightColor: style.webkitTapHighlightColor,
      focused: document.activeElement === el,
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
  const manageScroll = await probeManageScroll(page)

  // ── Library (открыть из manage через кнопку «Добавить из библиотеки») ──
  await page.locator('.mx-pinned-sheet__pill').last().click()
  await page.waitForTimeout(1500)
  const library = await measureLibrary(page)
  await page.screenshot({ path: `${OUT}/${name}-library.png` })
  const tapOutline = await probeTapOutline(page)

  await browser.close()
  return { manage, library, manageScroll, tapOutline }
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
  const manageScroll = await probeManageScroll(page)

  // ── Library ──
  await page.locator('.mx-pinned-sheet__pill').last().click()
  await page.waitForTimeout(1500)
  const library = await measureLibrary(page)
  const libraryTg = await page.evaluate(() => ({
    saveBtn: Boolean(document.querySelector('.mx-pinned-sheet__header-top .mx-pinned-sheet__circle')),
    sheetPaddingTop: getComputedStyle(document.querySelector('.mx-pinned-sheet')).paddingTop,
    bodyPaddingBottom: getComputedStyle(document.querySelector('.mx-pinned-sheet--library .mx-pinned-sheet__body')).paddingBottom,
  }))
  await page.screenshot({ path: `${OUT}/${name}-library.png` })

  await browser.close()
  return { manage, library, manageTg, libraryTg, manageScroll }
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

function exactRow(label, target, actual) {
  const ok = actual == null ? '—' : actual === target ? '✓' : '✗'
  console.log(`  ${label.padEnd(36)} | ${String(target).padStart(6)} | ${String(actual ?? '—').padStart(6)} | ${'—'.padStart(6)} | ${ok}`)
}

function printTableHead() {
  console.log(`  ${'Параметр'.padEnd(36)} | ${'эталон'.padStart(6)} | ${'у нас'.padStart(6)} | ${'Δ'.padStart(6)} | ok`)
}

function printManageTable(name, data) {
  const vw = data.viewport.w
  console.log(`\n=== «Твои практики» — ${name} (эталон / у нас / Δ, допуск ±2) ===`)
  printTableHead()
  tableRow('колонок в сетке', TARGET_MANAGE.cols, data.cols)
  tableRow('ширина карточки', manageCardW(vw), data.cardW)
  tableRow('высота карточки', TARGET_MANAGE.cardH, data.cardH)
  tableRow('зазор в сетке', TARGET_MANAGE.gap, data.gap)
  tableRow('круг-иконка (диаметр)', TARGET_MANAGE.icon, data.iconW)
  tableRow('svg внутри иконки', TARGET_MANAGE.iconSvg, data.iconSvgW)
  tableRow('кружок «…» (диаметр)', TARGET_MANAGE.more, data.moreW)
  tableRow('круг ✕ (диаметр)', TARGET_MANAGE.close, data.closeW)
  tableRow('заголовок font-size', TARGET_MANAGE.titleFontSize, data.titleFontSize)
  tableRow('заголовок font-weight', TARGET_MANAGE.titleFontWeight, Number(data.titleFontWeight))
  exactRow('заголовок цвет', TARGET_MANAGE.titleColor, data.titleColor)
  tableRow('подзаголовок font-size', TARGET_MANAGE.subtitleFontSize, data.subtitleFontSize)
  tableRow('пилюль внизу (кол-во)', TARGET_MANAGE.pillCount, data.pillCount)
  tableRow('ширина пилюли', TARGET_MANAGE.pillW, data.pillW)
  tableRow('высота пилюли', TARGET_MANAGE.pillH, data.pillH)
  tableRow('зазор пилюль', TARGET_MANAGE.pillGap, data.pillGap)
  tableRow('пилюли от низа экрана', TARGET_MANAGE.pillBottom, data.pillBottom)
}

function printLibraryTable(name, data) {
  console.log(`\n=== «Библиотека практик» — ${name} (эталон / у нас / Δ, допуск ±2) ===`)
  printTableHead()
  tableRow('кнопка ✓ (ширина)', TARGET_LIBRARY.save, data.saveBtnW)
  tableRow('кнопка ✓ (высота)', TARGET_LIBRARY.save, data.saveBtnH)
  tableRow('заголовок font-size', TARGET_LIBRARY.titleFontSize, data.titleFontSize)
  tableRow('заголовок font-weight', TARGET_LIBRARY.titleFontWeight, Number(data.titleFontWeight))
  tableRow('заголовок слева от края листа', TARGET_LIBRARY.titleLeft, data.titleLeft)
  tableRow('чипс высота', TARGET_LIBRARY.chipH, data.chipH)
  tableRow('чипс зазор', TARGET_LIBRARY.chipGap, data.chipGap)
  tableRow('чипс font-size', TARGET_LIBRARY.chipFontSize, data.chipFontSize)
  tableRow('чипсов (кол-во)', 2, data.chipCount)
  tableRow('строка высота', TARGET_LIBRARY.rowH, data.rowH)
  tableRow('круг-иконка строки (диаметр)', TARGET_LIBRARY.rowIcon, data.rowIconW)
  tableRow('название font-size', TARGET_LIBRARY.rowNameFontSize, data.rowNameFontSize)
  tableRow('название font-weight', TARGET_LIBRARY.rowNameFontWeight, Number(data.rowNameFontWeight))
  exactRow('название цвет', TARGET_LIBRARY.rowNameColor, data.rowNameColor)
  tableRow('разделитель от левого края', TARGET_LIBRARY.dividerLeft, data.dividerLeft)
  tableRow('«+» / кружок-галочка', TARGET_LIBRARY.toggle, data.toggleW ?? data.pinnedToggleW)
  tableRow('поиск ширина', TARGET_LIBRARY.searchW, data.searchW)
  tableRow('поиск высота', TARGET_LIBRARY.searchH, data.searchH)
  tableRow('поиск от низа экрана', TARGET_LIBRARY.searchBottom, data.searchBottom)
}

printManageTable('web-440', results['web-440'].manage)
printManageTable('web-393', results['web-393'].manage)
printManageTable('tg-440', results['tg-440'].manage)
printManageTable('tg-393', results['tg-393'].manage)

printLibraryTable('web-440', results['web-440'].library)
printLibraryTable('web-393', results['web-393'].library)
printLibraryTable('tg-440', results['tg-440'].library)
printLibraryTable('tg-393', results['tg-393'].library)

console.log('\n=== Скролл карточек под пилюлями (manage) ===')
for (const name of ['web-440', 'web-393', 'tg-440', 'tg-393']) {
  console.log(`  ${name}: ${JSON.stringify(results[name].manageScroll)}`)
}

console.log('\n=== Тап по строке библиотеки: рамки нет (web) ===')
for (const name of ['web-440', 'web-393']) {
  console.log(`  ${name}: ${JSON.stringify(results[name].tapOutline)}`)
}

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
