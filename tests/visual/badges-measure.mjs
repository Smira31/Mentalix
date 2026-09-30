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
  cardH: 338,
  horizonFromCardTop: 216,
  iconW: 77,
  iconBottomFromCardTop: 216,
  rowH: 91,
  rowGap: 7,
  seeAllPt: 23,
  seeAllPb: 50,
}

const round = v => Math.round(v * 10) / 10

async function openBadges(page) {
  await page.goto(`${BASE}/?demo=1`, { waitUntil: 'domcontentloaded' })
  await page.getByTestId('today-streak-chip').click()
  await page.getByTestId('series-tab-badges').waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(300)
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
    const card = rect('.mx-path-featured-award')
    const landscape = rect('.mx-path-featured-landscape')
    const icon = rect('.mx-path-featured-icon')
    const rows = [...document.querySelectorAll('.mx-path-award-row')].map(el => round(el.getBoundingClientRect().height))
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
      seeAll: { pt: saStyle.paddingTop, pb: saStyle.paddingBottom },
      headerBg: hStyle.backgroundColor,
      headerBackdrop: hStyle.backdropFilter || hStyle.webkitBackdropFilter || 'none',
      scroll: { top: round(scrollEl.scrollTop), height: scrollEl.scrollHeight, client: scrollEl.clientHeight },
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

const results = {}
results['chromium-440'] = await runBrowser('chromium-440', chromium, { width: 440, height: 900 })
results['chromium-393'] = await runBrowser('chromium-393', chromium, { width: 393, height: 852, mobile: true })
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
line('5. зазор строк', TARGET.rowGap, parseFloat(r440.rowGap))
line('6. «Все значки» padding-top', TARGET.seeAllPt, parseFloat(r440.seeAll.pt))
line('6. «Все значки» padding-bottom', TARGET.seeAllPb, parseFloat(r440.seeAll.pb))
console.log('\nШапка при скролле 0 (ожидание rgba(0, 0, 0, 0)):', r440.headerBg)
console.log('Шапка при скролле (ожидание стекло rgba(38,38,38,0.55)):', results['chromium-440'].scrolled.headerBg, '| backdrop:', results['chromium-440'].scrolled.headerBackdrop)
console.log('\nСкролл до конца (chromium 393, колесо):', JSON.stringify(results['chromium-393'].atBottom))
console.log('Скролл до конца (webkit iPhone):', JSON.stringify(results['webkit-iphone'].atBottom))
console.log('Тач-перехват контента chromium-393 (ожидание preventedAny=false):', JSON.stringify(results['chromium-393'].touchProbe))
console.log('Тач-проба webkit (TouchEvent-конструктор):', JSON.stringify(results['webkit-iphone'].touchProbe))
