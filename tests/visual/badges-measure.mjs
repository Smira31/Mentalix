/*
 * Замеры экрана «Значки | Статистика» против эталона Stoic (440pt).
 *
 * Запуск: node tests/visual/badges-measure.mjs [baseURL]
 *   baseURL — по умолчанию http://localhost:5173 (vite dev в контейнере).
 *   Скриншоты пишутся в /tmp/badges-measure/.
 *
 * Проверяет:
 *   1–6. геометрию (сегмент, ✕, карточка/горизонт, иконка, строки, «Все значки»)
 *   скролл: колесо (chromium, trusted wheel) и тач-жест (webkit iPhone):
 *   хук свайпа не должен перехватывать touchmove по контенту
 *   (defaultPrevented = false), список прокручивается до конца.
 */
import { chromium, webkit } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = '/tmp/badges-measure'
mkdirSync(OUT, { recursive: true })

// Эталон Stoic (440pt)
const TARGET = {
  tabs: { w: 200, h: 47 },
  close: { w: 44, h: 44 },
  cardH: 339,
  horizonFromCardTop: 216,
  iconW: 77,
  iconBottomFromCardTop: 216,
  // «Следующие значки» — эталон 440pt: строка 92, зазор 9, поля 16, радиус 16,
  // шар 55 (отступ слева 16), текст с 90, счётчик 14/600, полоса 43×2.
  rowH: 92,
  rowGap: 9,
  rowPadding: 16,
  rowRadius: 16,
  rowBall: 55,
  rowBallLeft: 16,
  rowTextLeft: 90,
  rowTitleSize: 16,
  rowTitleWeight: 500,
  rowCopySize: 11,
  rowCopyLines: 2,
  rowCounterSize: 14,
  rowCounterWeight: 600,
  rowProgress: { w: 43, h: 2 },
  seeAllPt: 23,
  seeAllPb: 50,
}

const round = v => Math.round(v * 10) / 10

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
  // SDK (telegram-web-app.js) перезаписывает window.Telegram.WebApp —
  // закрепляем мок геттером, как в tests/ux/telegram-p0-check.spec.mjs.
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
  // 2s — pessimistic окно tg-fullscreen (CONFIRMATION_TIMEOUT_MS): в web
  // за это время подтверждается fallback, геометрия стабилизируется.
  await page.waitForTimeout(2500)
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
    const rows = [...document.querySelectorAll('.mx-path-award-row')].map(el => round(el.getBoundingClientRect().height))
    const rowFirst = document.querySelector('.mx-path-award-row')
    const rowIcon = rowFirst?.querySelector('.mx-reward-icon')
    const rowRect = rowFirst?.getBoundingClientRect()
    const rowIconRect = rowIcon?.getBoundingClientRect()
    // Левый пик левого холма: bbox первого path пейзажа (верх bbox = пик).
    const hillBox = document.querySelector('.mx-path-featured-landscape path')?.getBBox()
    const ballLeftFromRowLeft =
      rowRect && rowIconRect ? round(rowIconRect.x - rowRect.x) : null
    const ballLeftFromCardLeft =
      rowIconRect && card ? round(rowIconRect.x - card.x) : null
    const rowStyle = rowFirst ? getComputedStyle(rowFirst) : null
    const rowTextRect = rowFirst?.querySelector('.mx-path-row-copy-wrap')?.getBoundingClientRect()
    const counterStyle = document.querySelector('.mx-path-row-value strong')
      ? getComputedStyle(document.querySelector('.mx-path-row-value strong'))
      : null
    const rowProgressRect = document
      .querySelector('.mx-path-award-row .mx-path-progress')
      ?.getBoundingClientRect()
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
      rows,
      rowGap: getComputedStyle(document.querySelector('.mx-path-award-list')).rowGap,
      rowPaddingLeft: rowStyle ? parseFloat(rowStyle.paddingLeft) : null,
      rowRadius: rowStyle ? parseFloat(rowStyle.borderRadius) : null,
      rowBallW: rowIconRect ? round(rowIconRect.width) : null,
      rowTextLeft: rowRect && rowTextRect ? round(rowTextRect.x - rowRect.x) : null,
      rowCounter: counterStyle
        ? { fontSize: parseFloat(counterStyle.fontSize), fontWeight: counterStyle.fontWeight }
        : null,
      rowProgressW: rowProgressRect ? round(rowProgressRect.width) : null,
      rowProgressH: rowProgressRect ? round(rowProgressRect.height) : null,
      ballLeftFromRowLeft,
      ballLeftFromCardLeft,
      landscapeW: landscape?.w ?? null,
      landscapeH: landscape?.h ?? null,
      hillPeakAboveHorizon:
        hillBox ? round(78.5 - hillBox.y) : null,
      seeAll: { pt: saStyle.paddingTop, pb: saStyle.paddingBottom },
      headerBg: hStyle.backgroundColor,
      headerBackdrop: hStyle.backdropFilter || hStyle.webkitBackdropFilter || 'none',
      scroll: { top: round(scrollEl.scrollTop), height: scrollEl.scrollHeight, client: scrollEl.clientHeight },
      // Правки владельца 30.09: зазор сегмент → карточка 43, строки
      // 18/400 + 13/400 muted в одну строку, пейзаж и шар статичны.
      segmentToCard:
        tabs && card ? round(card.y - (tabs.y + tabs.h)) : null,
      rowTitleFontSize: getComputedStyle(document.querySelector('.mx-path-row-title')).fontSize,
      rowTitleFontWeight: getComputedStyle(document.querySelector('.mx-path-row-title')).fontWeight,
      rowCopyStyle: (() => {
        const style = getComputedStyle(document.querySelector('.mx-path-row-copy'))
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          whiteSpace: style.whiteSpace,
          lineClamp: style.webkitLineClamp || style.lineClamp,
        }
      })(),
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
// Проверяем: жест НЕ перехватывает скролл (нет preventDefault) и контент
// можно прокрутить до конца.
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
        // legacy WebKit
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
        // legacy WebKit: нет конструктора TouchEvent
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
  await page.screenshot({ path: `${OUT}/${name}-top.png` })

  // Скролл вниз
  let touchProbe = null
  if (opts.touch || opts.mobile) {
    // Тач: контент (не кнопка) под пальцем — жест не должен перехватывать.
    // WebKit не поддерживает конструктор TouchEvent — там probe вернёт ошибку.
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
  await page.screenshot({ path: `${OUT}/${name}-scrolled.png` })
  await browser.close()
  return { atTop, scrolled, atBottom, touchProbe }
}

/*
 * Telegram-режим (эмуляция): сегмент на safe-top + 8, контент 16 под
 * сегментом, круги ✕/‹ отсутствуют, «все значки.» — заголовок на +8.
 */
async function runTelegram(name, width, height) {
  const browser = await chromium.launch()
  // isMobile/hasTouch → pointer: coarse → isRealPhone() → демо-панель ПК
  // выключена и не перекрывает сегмент, поднятый на safe-top + 8.
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  await context.addInitScript(TG_INIT_SCRIPT)
  const page = await context.newPage()
  await openBadges(page)
  const badges = await page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const surface = document.querySelector('.mx-path-surface').getBoundingClientRect()
    const tabs = document.querySelector('.mx-path-tabs').getBoundingClientRect()
    const card = document.querySelector('.mx-path-featured-award')?.getBoundingClientRect()
    return {
      segmentTopFromSurfaceTop: round(tabs.y - surface.y),
      contentGapUnderTabs: card ? round(card.y - tabs.bottom) : null,
      closeCircle: Boolean(document.querySelector('.mx-path-close')),
      backCircle: Boolean(document.querySelector('.mx-nested-screen-back')),
      surfacePaddingTop: getComputedStyle(document.querySelector('.mx-path-surface')).paddingTop,
    }
  })
  await page.screenshot({ path: `${OUT}/${name}-badges.png` })
  await page.getByTestId('series-tab-stats').click()
  await page.waitForTimeout(300)
  const statsGap = await page.evaluate(() => {
    const round = v => Math.round(v * 10) / 10
    const tabs = document.querySelector('.mx-path-tabs').getBoundingClientRect()
    const tile = document.querySelector('.mx-path-summary-card').getBoundingClientRect()
    return round(tile.y - tabs.bottom)
  })
  await page.screenshot({ path: `${OUT}/${name}-stats.png` })
  await page.getByTestId('series-tab-badges').click()
  await page.waitForTimeout(200)
  await page.locator('.mx-path-see-all').click()
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
  return { badges, statsGap, all }
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

console.log('\n=== Таблица (эталон 440pt vs факт 440px, скролл 0) ===')
line('1. сегмент w', TARGET.tabs.w, r440.tabs.w)
line('1. сегмент h', TARGET.tabs.h, r440.tabs.h)
line('2. крест w', TARGET.close.w, r440.close.w)
line('2. крест h', TARGET.close.h, r440.close.h)
line('3. карточка h', TARGET.cardH, r440.card.h)
line('3. горизонт от верха карточки', TARGET.horizonFromCardTop, r440.horizonFromCardTop)
line('4. иконка w', TARGET.iconW, r440.icon?.w)
line('4. низ иконки от верха карточки', TARGET.iconBottomFromCardTop, r440.icon?.bottomFromCardTop)
line('5. строка h', TARGET.rowH, r440.rows[0])
line('5. строка h (2-я)', TARGET.rowH, r440.rows[1])
line('5. строка h (3-я)', TARGET.rowH, r440.rows[2])
line('5. зазор строк', TARGET.rowGap, parseFloat(r440.rowGap))
line('5. поля строки (padding-left)', TARGET.rowPadding, r440.rowPaddingLeft)
line('5. радиус строки', TARGET.rowRadius, r440.rowRadius)
line('5. шар в строке (диаметр)', TARGET.rowBall, r440.rowBallW)
line('5. текст строки: left от края строки', TARGET.rowTextLeft, r440.rowTextLeft)
line('5. название строки font-size', TARGET.rowTitleSize, parseFloat(r440.rowTitleFontSize))
line('5. название строки font-weight', TARGET.rowTitleWeight, Number(r440.rowTitleFontWeight))
line('5. описание строки font-size', TARGET.rowCopySize, parseFloat(r440.rowCopyStyle.fontSize))
line('5. описание строки font-weight', 400, Number(r440.rowCopyStyle.fontWeight))
line('5. описание строки (строк, clamp)', TARGET.rowCopyLines, Number(r440.rowCopyStyle.lineClamp))
line('5. счётчик font-size', TARGET.rowCounterSize, r440.rowCounter?.fontSize)
line('5. счётчик font-weight', TARGET.rowCounterWeight, Number(r440.rowCounter?.fontWeight))
line('5. полоса прогресса w', TARGET.rowProgress.w, r440.rowProgressW)
line('5. полоса прогресса h', TARGET.rowProgress.h, r440.rowProgressH)
line('6. «Все значки» padding-top', TARGET.seeAllPt, parseFloat(r440.seeAll.pt))
line('6. «Все значки» padding-bottom', TARGET.seeAllPb, parseFloat(r440.seeAll.pb))
line('7. шар в строке: left от края строки', TARGET.rowBallLeft, r440.ballLeftFromRowLeft)
line('7. шар в строке: left от края карточки', TARGET.rowBallLeft, r440.ballLeftFromCardLeft)
line('8. пейзаж w', 408, r440.landscapeW)
line('8. пейзаж h', 80, r440.landscapeH)
line('8. пик холма над горизонтом', 38, r440.hillPeakAboveHorizon)
line('9. сегмент → карточка (440)', 43, r440.segmentToCard)
line('9. сегмент → карточка (393)', 43, results['chromium-393'].atTop.segmentToCard)
line('10. анимации пейзажа (440)', 0, r440.landscapeAnimations)
line('10. анимации шара, все экземпляры (440)', 0, r440.ballAnimations)
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
  console.log('1. «все значки.» заголовок от верха (ожидание 8):', result.all.titleTopFromSurfaceTop)
  console.log('1. круги на «все значки.» (ожидание false/false):', result.all.closeCircle, result.all.backCircle)
}
console.log('\nШапка при скролле 0 (ожидание rgba(0, 0, 0, 0)):', r440.headerBg)
console.log('Шапка при скролле (ожидание стекло rgba(38,38,38,0.55)):', results['chromium-440'].scrolled.headerBg, '| backdrop:', results['chromium-440'].scrolled.headerBackdrop)
console.log('\nСкролл до конца (chromium 393, колесо):', JSON.stringify(results['chromium-393'].atBottom))
console.log('Скролл до конца (webkit iPhone):', JSON.stringify(results['webkit-iphone'].atBottom))
console.log('Тач-перехват контента chromium-393 (ожидание preventedAny=false):', JSON.stringify(results['chromium-393'].touchProbe))
console.log('Тач-проба webkit (TouchEvent-конструктор):', JSON.stringify(results['webkit-iphone'].touchProbe))
