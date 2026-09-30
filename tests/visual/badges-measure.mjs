/*
 * Замеры экрана «Значки | Статистика» против эталона Stoic (393pt и 440pt).
 *
 * Запуск: node tests/visual/badges-measure.mjs [baseURL]
 *   baseURL — по умолчанию http://localhost:5173 (vite dev в контейнере).
 *   Скриншоты пишутся в /tmp/badges-measure/.
 *
 * Проверяет:
 *   1–6. геометрию (сегмент, ✕, карточка/горизонт, иконка, строки, «Все значки»)
 *   п.3 «Следующие значки»: таблица эталон / у нас / Δ (±2pt) — 393 и 440, web + TG
 *   скролл: колесо (chromium) и тач-жест (webkit iPhone):
 *   хук свайпа не должен перехватывать touchmove по контенту
 *   (defaultPrevented = false), список прокручивается до конца.
 *   обе вкладки (Значки + Статистика): шапка всегда прозрачная, скролл работает.
 */
import { chromium, webkit } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = '/tmp/badges-measure'
mkdirSync(OUT, { recursive: true })

// Эталон Stoic — строки «Следующие значки» (393pt)
const TARGET_ROW = {
  rowH: 82,
  rowGap: 8,
  ballSize: 50,
  ballLeftFromEdge: 14,
  textLeftFromRowLeft: 80,
  titleFontSize: 15,
  titleFontWeight: 500,
  copyFontSize: 11,
  copyFontWeight: 400,
  copyLineClamp: 2,
  copyWhiteSpace: 'normal',
  counterFontSize: 13,
  counterFontWeight: 600,
  progressW: 39,
  progressH: 2,
  rowCount: 6,
}

// Эталон Stoic — общая геометрия (440pt)
const TARGET = {
  tabs: { w: 200, h: 47 },
  close: { w: 44, h: 44 },
  cardH: 339,
  horizonFromCardTop: 216,
  iconW: 77,
  iconBottomFromCardTop: 216,
  seeAllPt: 23,
  seeAllPb: 50,
}

const round = v => Math.round(v * 10) / 10
const TOL = 2 // ±2pt

/*
 * Эмуляция Telegram (как в tests/ux/telegram-p0-check.spec.mjs): подписанные
 * initData → platformName = 'telegram', isFullscreen: true → pessimistic
 * snapshot. Инсеты 0 → --app-safe-top = 0, сегмент должен встать на top 8.
 */
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
  window.__telegramBackState = button
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
    get() {
      return webApp
    },
    set() {},
  })
`

async function openBadges(page) {
  await page.goto(`${BASE}/?demo=1`, { waitUntil: 'domcontentloaded' })
  await page.getByTestId('today-streak-chip').click()
  await page.getByTestId('series-tab-badges').waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(2500)
}

// Замеры строк «Следующие значки» — для таблицы по п.3
async function measureRows(page) {
  return page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const rowFirst = document.querySelector('.mx-path-award-row')
    if (!rowFirst) return null
    const rowRect = rowFirst.getBoundingClientRect()
    const rowIcon = rowFirst.querySelector('.mx-reward-icon')
    const rowIconRect = rowIcon?.getBoundingClientRect()
    const title = rowFirst.querySelector('.mx-path-row-title')
    const copy = rowFirst.querySelector('.mx-path-row-copy')
    const counter = rowFirst.querySelector('.mx-path-row-value strong')
    const progress = rowFirst.querySelector('.mx-path-progress')
    const titleRect = title?.getBoundingClientRect()
    const rows = [...document.querySelectorAll('.mx-path-award-row')]
    const list = document.querySelector('.mx-path-award-list')
    const endLink = document.querySelector('.mx-path-see-all--end')
    return {
      rowCount: rows.length,
      rowH: round(rowRect.height),
      rowGap: parseFloat(getComputedStyle(list).rowGap),
      ballW: rowIconRect ? round(rowIconRect.width) : null,
      ballLeftFromRowLeft: rowIconRect ? round(rowIconRect.x - rowRect.x) : null,
      textLeftFromRowLeft: titleRect ? round(titleRect.x - rowRect.x) : null,
      titleFontSize: parseFloat(getComputedStyle(title).fontSize),
      titleFontWeight: getComputedStyle(title).fontWeight,
      copyFontSize: parseFloat(getComputedStyle(copy).fontSize),
      copyFontWeight: getComputedStyle(copy).fontWeight,
      copyWhiteSpace: getComputedStyle(copy).whiteSpace,
      copyLineClamp: getComputedStyle(copy).webkitLineClamp,
      counterFontSize: parseFloat(getComputedStyle(counter).fontSize),
      counterFontWeight: getComputedStyle(counter).fontWeight,
      progressW: progress ? round(progress.getBoundingClientRect().width) : null,
      progressH: progress ? round(progress.getBoundingClientRect().height) : null,
      hasEndLink: Boolean(endLink),
    }
  })
}

async function measure(page) {
  return page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const rect = sel => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) }
    }
    const tabs = rect('.mx-path-tabs')
    const card = rect('.mx-path-featured-award')
    const landscape = rect('.mx-path-featured-landscape')
    const icon = rect('.mx-path-featured-icon')
    const hillBox = document.querySelector('.mx-path-featured-landscape path')?.getBBox()
    const seeAll = document.querySelector('.mx-path-see-all')
    const saStyle = getComputedStyle(seeAll)
    const header = document.querySelector('.mx-path-scroll--overlay .mx-path-header')
    const hStyle = getComputedStyle(header)
    const scrollEl = document.querySelector('.mx-path-scroll--overlay')
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      tabs: rect('.mx-path-tabs'),
      close: rect('.mx-path-close'),
      card,
      horizonFromCardTop: landscape && card ? round(landscape.y + landscape.h - card.y) : null,
      icon: icon && card ? { w: icon.w, h: icon.h, bottomFromCardTop: round(icon.y + icon.h - card.y) } : null,
      landscapeW: landscape?.w ?? null,
      landscapeH: landscape?.h ?? null,
      hillPeakAboveHorizon: hillBox ? round(78.5 - hillBox.y) : null,
      seeAll: { pt: saStyle.paddingTop, pb: saStyle.paddingBottom },
      headerBg: hStyle.backgroundColor,
      headerBackdrop: hStyle.backdropFilter || hStyle.webkitBackdropFilter || 'none',
      scroll: { top: round(scrollEl.scrollTop), height: scrollEl.scrollHeight, client: scrollEl.clientHeight },
      segmentToCard: tabs && card ? round(card.y - (tabs.y + tabs.h)) : null,
      landscapeAnimations:
        document.querySelector('.mx-path-featured-landscape')?.getAnimations().length ?? null,
      ballAnimations: [...document.querySelectorAll('.mx-reward-icon')].reduce(
        (sum, el) => sum + el.getAnimations().length,
        0
      ),
    }
  })
}

// Синтетическая тач-последовательность: хук слушает touchstart/touchmove
// через addEventListener, поэтому реагирует и на программные события.
async function touchSwipeProbe(page, selector) {
  return page.evaluate(sel => {
    const doc = document
    const w = doc.defaultView
    const el = doc.querySelector('.mx-path-scroll--overlay')
    const target = doc.querySelector(sel)
    const r = target.getBoundingClientRect()
    const makeTouch = y => {
      try {
        return new w.Touch({ identifier: 1, target, clientX: r.x + r.width / 2, clientY: y })
      } catch {
        return doc.createTouch(w, target, 1, r.x + r.width / 2, y, 0, 0)
      }
    }
    const makeList = (touches, empty) => {
      try {
        return empty ? [] : touches
      } catch {
        return touches
      }
    }
    const fire = (type, y) => {
      const touch = makeTouch(y)
      const touches = type === 'touchend' ? makeList([], true) : makeList([touch])
      let ev
      try {
        ev = new w.TouchEvent(type, { touches, bubbles: true, cancelable: true, composed: true })
      } catch {
        ev = doc.createEvent('TouchEvent')
        const empty = doc.createTouchList()
        const list = type === 'touchend' ? empty : doc.createTouchList(touch)
        ev.initTouchEvent(type, true, true, w, 0, list, list, list, false, false, false, false)
      }
      el.dispatchEvent(ev)
      return ev.defaultPrevented
    }
    const startY = r.y + r.height / 2
    fire('touchstart', startY)
    const prevented = []
    for (let i = 1; i <= 10; i++) prevented.push(fire('touchmove', startY - i * 12))
    fire('touchend', startY - 120)
    return { preventedAny: prevented.some(Boolean), scrollTopAfter: el.scrollTop }
  }, selector)
}

// Проверка скролла для обеих вкладок.
// Ждём стабилизации контента (scrollHeight > clientHeight) и подтверждаем,
// что программный скролл действительно сработал — без фиксированных таймаутов.
async function scrollCheck(page, tab) {
  const scrollEl = '.mx-path-scroll--overlay'
  // Сбрасываем скролл в 0 — общий контейнер может остаться прокрученным
  // от предыдущей вкладки, и before.scrollTop будет не 0.
  await page.evaluate(sel => {
    document.querySelector(sel).scrollTop = 0
  }, scrollEl)
  // Ждём, пока контент не переполнит скролл-контейнер (рендер завершён).
  await page.waitForFunction(
    sel => {
      const el = document.querySelector(sel)
      return el && el.scrollHeight > el.clientHeight
    },
    scrollEl,
    { timeout: 5000 }
  )
  const before = await page.evaluate(sel => {
    const el = document.querySelector(sel)
    return { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
  }, scrollEl)
  if (before.scrollHeight <= before.clientHeight) return { scrollable: false, scrolled: false, tab }
  await page.evaluate(sel => {
    document.querySelector(sel).scrollTop = document.querySelector(sel).scrollHeight
  }, scrollEl)
  // Ждём, пока scrollTop действительно изменится (скролл не сброшен ререндером).
  await page.waitForFunction(
    sel => {
      const el = document.querySelector(sel)
      return el.scrollTop > 0
    },
    scrollEl,
    { timeout: 2000 }
  )
  const after = await page.evaluate(sel => {
    const el = document.querySelector(sel)
    const header = el.querySelector('.mx-path-header')
    return {
      scrollTop: el.scrollTop,
      headerBg: getComputedStyle(header).backgroundColor,
      fullyScrolled: el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
    }
  }, scrollEl)
  return {
    scrollable: true,
    scrolled: after.scrollTop > before.scrollTop,
    headerBgTransparent: after.headerBg === 'rgba(0, 0, 0, 0)',
    tab,
  }
}

async function runBrowser(name, launcher, opts) {
  const browser = await launcher.launch()
  const context = await browser.newContext({
    viewport: { width: opts.width, height: opts.height },
    hasTouch: Boolean(opts.touch || opts.mobile),
    isMobile: Boolean(opts.mobile),
    userAgent: opts.userAgent,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await openBadges(page)

  const atTop = await measure(page)
  const rowsTop = await measureRows(page)
  await page.screenshot({ path: `${OUT}/${name}-top.png` })

  // Скролл вниз
  let touchProbe = null
  if (opts.touch || opts.mobile) {
    try {
      touchProbe = await touchSwipeProbe(page, '.mx-path-featured-title')
    } catch (error) {
      touchProbe = { unavailable: String(error).split('\n')[0] }
    }
  }
  if (opts.touch) {
    await page.evaluate(() => {
      const el = document.querySelector('.mx-path-scroll--overlay')
      el.scrollTop = el.scrollHeight
    })
  } else {
    await page.mouse.move(opts.width / 2, 400)
    for (let i = 0; i < 20; i++) await page.mouse.wheel(0, 120)
    await page.waitForTimeout(300)
  }
  const scrolled = await measure(page)
  await page.evaluate(() => document.querySelector('.mx-path-scroll--overlay').scrollTo(0, 999999))
  await page.waitForTimeout(200)
  const atBottom = await page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const el = document.querySelector('.mx-path-scroll--overlay')
    const rows = el.querySelectorAll('.mx-path-award-row')
    const last = rows[rows.length - 1]
    const r = last.getBoundingClientRect()
    const c = el.getBoundingClientRect()
    return {
      scrollTop: round(el.scrollTop),
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      fullyScrolled: el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
      lastRowVisible: r.bottom <= c.bottom + 2 && r.top >= c.top - 2,
      headerBg: getComputedStyle(el.querySelector('.mx-path-header')).backgroundColor,
    }
  })

  // Скролл-проверка обеих вкладок
  await page.evaluate(() => document.querySelector('.mx-path-scroll--overlay').scrollTo(0, 0))
  await page.waitForTimeout(200)
  const scrollBadges = await scrollCheck(page, 'badges')
  await page.getByTestId('series-tab-stats').click()
  await page.waitForSelector('.mx-path-summary-card', { state: 'visible', timeout: 5000 })
  const scrollStats = await scrollCheck(page, 'stats')
  await page.getByTestId('series-tab-badges').click()
  await page.waitForTimeout(200)

  await page.screenshot({ path: `${OUT}/${name}-scrolled.png` })
  await browser.close()
  return { atTop, rowsTop, scrolled, atBottom, touchProbe, scrollBadges, scrollStats }
}

/*
 * Telegram-режим (эмуляция): сегмент на safe-top + 8, контент 43 под
 * сегментом, круги ✕/‹ отсутствуют, «все значки.» — заголовок на safe-top.
 */
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
  await openBadges(page)
  const rowsTop = await measureRows(page)
  const badges = await page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const surface = document.querySelector('.mx-path-surface').getBoundingClientRect()
    const tabs = document.querySelector('.mx-path-tabs').getBoundingClientRect()
    const card = document.querySelector('.mx-path-featured-award')?.getBoundingClientRect()
    const header = document.querySelector('.mx-path-header')
    return {
      segmentTopFromSurfaceTop: round(tabs.y - surface.y),
      contentGapUnderTabs: card ? round(card.y - tabs.bottom) : null,
      closeCircle: Boolean(document.querySelector('.mx-path-close')),
      backCircle: Boolean(document.querySelector('.mx-nested-screen-back')),
      surfacePaddingTop: getComputedStyle(document.querySelector('.mx-path-surface')).paddingTop,
      headerBg: header ? getComputedStyle(header).backgroundColor : null,
    }
  })
  await page.screenshot({ path: `${OUT}/${name}-badges.png` })

  // Скролл-проверка обеих вкладок в Telegram
  await page.evaluate(() => document.querySelector('.mx-path-scroll--overlay').scrollTo(0, 0))
  await page.waitForTimeout(200)
  const scrollBadges = await scrollCheck(page, 'badges')
  await page.getByTestId('series-tab-stats').click()
  await page.waitForSelector('.mx-path-summary-card', { state: 'visible', timeout: 5000 })
  const scrollStats = await scrollCheck(page, 'stats')
  const statsGap = await page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const tabs = document.querySelector('.mx-path-tabs').getBoundingClientRect()
    const tile = document.querySelector('.mx-path-summary-card').getBoundingClientRect()
    return round(tile.y - tabs.bottom)
  })
  await page.screenshot({ path: `${OUT}/${name}-stats.png` })
  await page.getByTestId('series-tab-badges').click()
  await page.waitForTimeout(200)
  await page.locator('.mx-path-see-all').first().click()
  await page.getByTestId('all-badges-screen').waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(200)
  const all = await page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const surface = document.querySelector('.mx-path-surface').getBoundingClientRect()
    const h1 = document.querySelector('.mx-path-all-badges > h1').getBoundingClientRect()
    return {
      titleTopFromSurfaceTop: round(h1.y - surface.y),
      closeCircle: Boolean(document.querySelector('.mx-path-close')),
      backCircle: Boolean(document.querySelector('.mx-nested-screen-back')),
    }
  })
  await page.screenshot({ path: `${OUT}/${name}-all.png` })
  await browser.close()
  return { badges, rowsTop, statsGap, all, scrollBadges, scrollStats }
}

const results = {}
results['chromium-440'] = await runBrowser('chromium-440', chromium, { width: 440, height: 900 })
results['chromium-393'] = await runBrowser('chromium-393', chromium, { width: 393, height: 852, mobile: true })
results['tg-440'] = await runTelegram('tg-440', 440, 900)
results['tg-393'] = await runTelegram('tg-393', 393, 852)
results['webkit-iphone'] = await runBrowser('webkit-iphone', webkit, {
  width: 393,
  height: 852,
  touch: true,
  mobile: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

const r440 = results['chromium-440'].atTop
const line = (name, target, actual) =>
  console.log(`${name}: эталон ${target}, факт ${actual}, Δ ${actual == null ? '—' : round(actual - target)}`)

// Таблица по п.3 «Следующие значки» — эталон / у нас / Δ (±2pt)
function printRowTable(label, rows) {
  if (!rows) { console.log(`\n--- ${label}: строки не найдены ---`); return }
  const pass = (a, b) => (a != null && Math.abs(a - b) <= TOL ? '✓' : '✗')
  console.log(`\n=== ${label}: таблица «Следующие значки» (эталон / у нас / Δ, ±${TOL}pt) ===`)
  console.log('Параметр                           | Эталон | У нас  | Δ     |')
  console.log('----------------------------------|--------|--------|-------|')
  const fmt = (name, target, actual) => {
    const delta = actual == null ? '—' : round(actual - target)
    const ok = typeof target === 'number' && typeof actual === 'number' ? pass(actual, target) : ''
    console.log(`${name.padEnd(34)}| ${String(target).padEnd(7)}| ${String(actual ?? '—').padEnd(7)}| ${String(delta).padEnd(6)}${ok}`)
  }
  fmt('Высота строки (pt)', TARGET_ROW.rowH, rows.rowH)
  fmt('Зазор строк (pt)', TARGET_ROW.rowGap, rows.rowGap)
  fmt('Размер шара (pt)', TARGET_ROW.ballSize, rows.ballW)
  fmt('Шар: отступ от края (pt)', TARGET_ROW.ballLeftFromEdge, rows.ballLeftFromRowLeft)
  fmt('Текст: отступ от края (pt)', TARGET_ROW.textLeftFromRowLeft, rows.textLeftFromRowLeft)
  fmt('Название font-size (pt)', TARGET_ROW.titleFontSize, rows.titleFontSize)
  fmt('Название font-weight', TARGET_ROW.titleFontWeight, rows.titleFontWeight)
  fmt('Описание font-size (pt)', TARGET_ROW.copyFontSize, rows.copyFontSize)
  fmt('Описание font-weight', TARGET_ROW.copyFontWeight, rows.copyFontWeight)
  fmt('Счётчик font-size (pt)', TARGET_ROW.counterFontSize, rows.counterFontSize)
  fmt('Счётчик font-weight', TARGET_ROW.counterFontWeight, rows.counterFontWeight)
  fmt('Прогресс ширина (pt)', TARGET_ROW.progressW, rows.progressW)
  fmt('Прогресс высота (pt)', TARGET_ROW.progressH, rows.progressH)
  fmt('Кол-во строк', TARGET_ROW.rowCount, rows.rowCount)
  console.log(`Описание white-space (эталон ${TARGET_ROW.copyWhiteSpace}, факт ${rows.copyWhiteSpace})`)
  console.log(`Описание line-clamp (эталон ${TARGET_ROW.copyLineClamp}, факт ${rows.copyLineClamp})`)
  console.log(`«Все значки ›» в конце (ожидание true): ${rows.hasEndLink}`)
}

console.log('\n=== Таблица (эталон 440pt vs факт 440px, скролл 0) ===')
line('1. сегмент w', TARGET.tabs.w, r440.tabs.w)
line('1. сегмент h', TARGET.tabs.h, r440.tabs.h)
line('2. крест w', TARGET.close.w, r440.close.w)
line('2. крест h', TARGET.close.h, r440.close.h)
line('3. карточка h', TARGET.cardH, r440.card.h)
line('3. горизонт от верха карточки', TARGET.horizonFromCardTop, r440.horizonFromCardTop)
line('4. иконка w', TARGET.iconW, r440.icon?.w)
line('4. низ иконки от верха карточки', TARGET.iconBottomFromCardTop, r440.icon?.bottomFromCardTop)
line('6. «Все значки» padding-top', TARGET.seeAllPt, parseFloat(r440.seeAll.pt))
line('6. «Все значки» padding-bottom', TARGET.seeAllPb, parseFloat(r440.seeAll.pb))
line('8. пейзаж w', 408, r440.landscapeW)
line('8. пейзаж h', 80, r440.landscapeH)
line('8. пик холма над горизонтом', 38, r440.hillPeakAboveHorizon)
line('9. сегмент → карточка (440)', 43, r440.segmentToCard)
line('9. сегмент → карточка (393)', 43, results['chromium-393'].atTop.segmentToCard)
line('10. анимации пейзажа (440)', 0, r440.landscapeAnimations)
line('10. анимации шара, все экземпляры (440)', 0, r440.ballAnimations)

// Таблицы по п.3 для всех конфигураций
printRowTable('Web 393px', results['chromium-393'].rowsTop)
printRowTable('Web 440px', results['chromium-440'].rowsTop)
printRowTable('Telegram 393px', results['tg-393'].rowsTop)
printRowTable('Telegram 440px', results['tg-440'].rowsTop)

console.log('\n=== Telegram (эмуляция), верх экрана ===')
for (const [name, result] of [
  ['tg-440', results['tg-440']],
  ['tg-393', results['tg-393']],
]) {
  console.log(`--- ${name} ---`)
  console.log('1. сегмент от верха поверхности (ожидание 8):', result.badges.segmentTopFromSurfaceTop)
  console.log('1. сегмент → карточка «Значки» (ожидание 43):', result.badges.contentGapUnderTabs)
  console.log('1. сегмент → плитка «Статистика» (ожидание 43):', result.statsGap)
  console.log('1. paddingTop поверхности (ожидание var(--app-safe-top)):', result.badges.surfacePaddingTop)
  console.log('1. круг ✕ (ожидание false):', result.badges.closeCircle, '| круг ‹ (ожидание false):', result.badges.backCircle)
  console.log('1. «все значки.» заголовок от верха (ожидание 0, safe-top):', result.all.titleTopFromSurfaceTop)
  console.log('1. круги на «все значки.» (ожидание false/false):', result.all.closeCircle, result.all.backCircle)
  console.log('1. шапка фон (ожидание transparent):', result.badges.headerBg)
}

console.log('\n=== Шапка: всегда прозрачная (Stoic) ===')
console.log('Шапка при скролле 0 (ожидание rgba(0, 0, 0, 0)):', r440.headerBg)
console.log('Шапка при скролле (ожидание rgba(0, 0, 0, 0)):', results['chromium-440'].scrolled.headerBg, '| backdrop:', results['chromium-440'].scrolled.headerBackdrop)

console.log('\n=== Скролл обеих вкладок ===')
for (const [name, result] of [
  ['chromium-393', results['chromium-393']],
  ['chromium-440', results['chromium-440']],
  ['tg-393', results['tg-393']],
  ['tg-440', results['tg-440']],
]) {
  console.log(`--- ${name} ---`)
  console.log('Значки:', JSON.stringify(result.scrollBadges))
  console.log('Статистика:', JSON.stringify(result.scrollStats))
}

console.log('\n=== Скролл до конца ===')
console.log('Скролл до конца (chromium 393, колесо):', JSON.stringify(results['chromium-393'].atBottom))
console.log('Скролл до конца (webkit iPhone):', JSON.stringify(results['webkit-iphone'].atBottom))
console.log('Тач-перехват контента chromium-393 (ожидание preventedAny=false):', JSON.stringify(results['chromium-393'].touchProbe))
console.log('Тач-проба webkit (TouchEvent-конструктор):', JSON.stringify(results['webkit-iphone'].touchProbe))
