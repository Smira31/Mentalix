/**
 * tests/visual/theme-measure.mjs
 *
 * Измеряет экран «Тема недели» в 3 положениях скролла:
 *   1. верх (карусель + CTA)
 *   2. «Другие темы»
 *   3. «Все темы»
 *
 * Собирает getBoundingClientRect + computed font-size/font-weight/font-family/color
 * для каждого элемента из эталонной таблицы и печатает отчёт:
 *   элемент / эталон / у нас / разница
 *
 * Запуск:
 *   npx playwright test --config=tests/visual/theme-measure.config.mjs
 *   или: node tests/visual/theme-measure.mjs
 *
 * Скриншоты пишутся в /tmp (не коммитить).
 */

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const PORT = 4174
const SHOT_DIR = '/tmp/theme-measure'
const VIEWPORT = { width: 440, height: 956 }

const TEST_USER = {
  id: 900001,
  first_name: 'UX',
  username: 'local_ux_check',
}

const THEME_FIXTURE = {
  id: 701,
  title: 'о меньшем усилии',
  subtitle: 'Семь коротких наблюдений о том, что действительно двигает.',
  current_day: 2,
  free_days: 7,
  days: [
    {
      day: 1,
      text: 'Бывало так, что ты переставал давить — и дело вдруг шло легче?',
      prompt: 'Что тогда произошло на самом деле?',
      reflection: 'Я сделал **один** спокойный шаг.',
      locked: false,
    },
    {
      day: 2,
      text: 'Усилие и напряжение — разные вещи. Первое двигает, второе только изматывает.',
      prompt: 'Где сегодня ты напрягался вместо того, чтобы делать?',
      reflection: '',
      locked: false,
    },
    ...Array.from({ length: 5 }, (_, index) => ({
      day: index + 3,
      text: 'Следующий вопрос недели.',
      prompt: 'Что замечаешь?',
      reflection: '',
      locked: false,
    })),
  ],
}

const THEMES_FIXTURE = [
  {
    id: 701,
    title: 'о меньшем усилии',
    subtitle: 'Семь коротких наблюдений о том, что действительно двигает.',
    total_days: 7,
    reflected_days: 1,
  },
  {
    id: 702,
    title: 'Границы и забота о себе',
    subtitle: 'Неделя про «нет», которое бережёт «да».',
    total_days: 7,
    reflected_days: 0,
  },
]

const THEME2_FIXTURE = {
  id: 702,
  title: 'Границы и забота о себе',
  subtitle: 'Неделя про «нет», которое бережёт «да».',
  current_day: 1,
  free_days: 7,
  days: [
    {
      day: 1,
      text: 'Какое «нет» сегодня было трудным и почему?',
      prompt: 'Запиши одно наблюдение без оценки.',
      reflection: '',
      locked: false,
    },
    ...Array.from({ length: 6 }, (_, index) => ({
      day: index + 2,
      text: 'Следующий вопрос недели.',
      prompt: 'Что замечаешь?',
      reflection: '',
      locked: false,
    })),
  ],
}

function jsonResponse(body, status = 200) {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function fixtureFor(request) {
  const url = new URL(request.url())
  const pathname = url.pathname
  const method = request.method()

  if (method !== 'GET') return jsonResponse({ ok: true })

  if (pathname === '/api/profile') return jsonResponse(TEST_USER)
  if (pathname === '/api/themes') return jsonResponse(THEMES_FIXTURE)
  if (pathname === '/api/themes/701') return jsonResponse(THEME_FIXTURE)
  if (pathname === '/api/themes/702') return jsonResponse(THEME2_FIXTURE)
  if (pathname === '/api/checkin/today') return jsonResponse(null)
  if (pathname === '/api/checkin/history') return jsonResponse([])
  if (pathname === '/api/streak')
    return jsonResponse({ current_streak: 0, longest_streak: 0, total_active_days: 0, is_active_today: false })
  if (pathname === '/api/streak/recovery')
    return jsonResponse({ recoverable: false, date: null, streak_before: 0 })
  if (pathname === '/api/rituals') return jsonResponse([])
  if (pathname === '/api/ascezas') return jsonResponse([])
  if (pathname === '/api/quotes/today')
    return jsonResponse({ text: 'Один спокойный шаг важнее идеального плана.' })
  if (pathname === '/api/profile/settings') return jsonResponse({ review_hour: 24 })
  if (pathname === '/api/analytics/pulse') return jsonResponse({ active_today: 12 })
  if (pathname === '/api/analytics/influences')
    return jsonResponse({ period: { from: '2026-09-21', to: '2026-09-27' }, days_with_data: 0, top_emotions: [], lifts: [], drags: [], enough_data: false })
  if (pathname === '/api/pinned-practices') return jsonResponse([])
  if (pathname === '/api/mood-practices') return jsonResponse([])
  if (pathname === '/api/practice-days') return jsonResponse({ days: [] })
  if (pathname === '/api/articles') return jsonResponse([])
  if (pathname === '/api/analytics')
    return jsonResponse({ period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] })
  if (pathname === '/api/health') return jsonResponse({ status: 'ok' })
  if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
  if (pathname === '/api/mentalix/messages') return jsonResponse([])
  return jsonResponse({})
}

/* --- Эталон (pt = px при 440px viewport) --- */
const SPECS = [
  // Шапка
  { id: 'header-h1', label: 'Шапка «Тема недели:»', sel: '.mx-theme-carousel-heading', expect: { fontSize: 29, fontWeight: 400, fontFamily: 'serif' } },
  { id: 'header-h2', label: 'Шапка «о меньшем усилии.»', sel: '.mx-theme-carousel-title', expect: { fontSize: 29, fontWeight: 700, fontFamily: 'Onest' } },
  // Карусель
  { id: 'card-active', label: 'Активная карточка', sel: ".mx-theme-carousel-q[data-active='true']", expect: { width: 298, height: 360, radius: 33 } },
  { id: 'card-num', label: 'Номер карточки', sel: ".mx-theme-carousel-q[data-active='true'] .mx-theme-carousel-q__num", expect: { fontSize: 38, fontWeight: 400, fontFamily: 'serif' } },
  { id: 'card-text', label: 'Текст вопроса', sel: ".mx-theme-carousel-q[data-active='true'] .mx-theme-carousel-q__text", expect: { fontSize: 17, fontWeight: 600, fontFamily: 'Onest' } },
  { id: 'card-prompt', label: 'Подсказка', sel: ".mx-theme-carousel-q[data-active='true'] .mx-theme-carousel-q__prompt", expect: { fontSize: 15, fontWeight: 400 } },
  // Точки
  { id: 'dots', label: 'Точки-пейджер', sel: '.mx-theme-carousel-dots', expect: { count: 7, dotSize: 8, gap: 8 } },
  // Кнопка
  { id: 'cta', label: 'Кнопка «Начать запись»', sel: '.mx-theme-carousel-cta', expect: { width: 173, height: 44, fontSize: 17, fontWeight: 600, bg: '#d0d0d0', color: '#111' } },
  // Другие темы
  { id: 'other-heading', label: '«Другие темы» заголовок', sel: '#carousel-other-themes', expect: { fontSize: 29, fontWeight: 400, fontFamily: 'serif' } },
  { id: 'other-card', label: 'Карточка темы', sel: '.mx-theme-directory__row', expect: { width: 408, height: 190, radius: 26 } },
  { id: 'other-title', label: 'Название темы', sel: '.mx-theme-directory__info strong', expect: { fontSize: 29, fontWeight: 700, color: '#d4d4d4' } },
  { id: 'other-desc', label: 'Описание темы', sel: '.mx-theme-directory__info small', expect: { fontSize: 17, fontWeight: 400 } },
  { id: 'other-progress', label: 'Полоска прогресса', sel: '.mx-theme-directory__progress', expect: { width: 110, height: 3 } },
  { id: 'other-chevron', label: 'Шеврон', sel: '.mx-theme-directory__bottom svg', expect: { size: 16 } },
  // Удиви меня
  { id: 'surprise', label: '«Удиви меня»', sel: '.mx-theme-directory__surprise', expect: { width: 156, height: 43, fontSize: 17, fontWeight: 500 } },
  // Все темы
  { id: 'all-heading', label: '«Все темы» заголовок', sel: '#carousel-all-themes', expect: { fontSize: 29, fontWeight: 400, fontFamily: 'serif' } },
  { id: 'filter-chip', label: 'Чип фильтра', sel: '.mx-theme-directory__filters button', expect: { height: 34, fontSize: 17, fontWeight: 500 } },
]

async function measureElement(page, sel, expect) {
  return await page.evaluate(
    ({ sel, expect }) => {
      const el = document.querySelector(sel)
      if (!el) return { found: false, sel }

      const rect = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const result = {
        found: true,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        fontSize: Math.round(parseFloat(cs.fontSize)),
        fontWeight: parseInt(cs.fontWeight),
        fontFamily: cs.fontFamily,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderRadius: parseInt(cs.borderRadius) || 0,
      }

      if (expect.count) {
        const parent = el
        result.count = parent.children.length
        if (result.count > 0) {
          const first = parent.children[0]
          const r = first.getBoundingClientRect()
          result.dotSize = Math.round(r.width)
          if (parent.children.length > 1) {
            const second = parent.children[1]
            const r2 = second.getBoundingClientRect()
            result.gap = Math.round(r2.x - r.x - r.width)
          }
        }
      }

      if (expect.size) {
        const svg = el
        result.svgWidth = Math.round(svg.getBoundingClientRect().width)
      }

      return result
    },
    { sel, expect }
  )
}

// Маппинг ключей эталона → ключей измерения
const KEY_MAP = { radius: 'borderRadius', bg: 'backgroundColor', size: 'svgWidth', color: 'color' }

function hexToRgb(hex) {
  const m3 = hex.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (m3) return `rgb(${parseInt(m3[1] + m3[1], 16)}, ${parseInt(m3[2] + m3[2], 16)}, ${parseInt(m3[3] + m3[3], 16)})`
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return null
  return `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})`
}

function parsePx(val) {
  if (typeof val === 'number') return val
  const m = String(val || '').match(/^([\d.]+)px$/)
  return m ? Math.round(parseFloat(m[1])) : undefined
}

function formatDiff(actual, expected, key) {
  if (expected[key] === undefined) return ''
  const actualKey = KEY_MAP[key] || key
  const a = actual[actualKey]
  const e = expected[key]
  if (typeof e === 'number' && typeof a === 'number') {
    const diff = a - e
    if (Math.abs(diff) <= 2) return `✓ ${a}`
    return `✗ ${a} (Δ${diff > 0 ? '+' : ''}${diff})`
  }
  if (typeof e === 'string') {
    const aStr = String(a || '')
    if (e === 'serif') {
      return aStr.includes('Lora') || aStr.includes('PT Serif') || aStr.includes('Georgia') || aStr.includes('serif')
        ? `✓ ${aStr.split(',')[0].trim()}`
        : `✗ ${aStr}`
    }
    if (e === 'Onest') {
      return aStr.includes('Onest') ? `✓ Onest` : `✗ ${aStr}`
    }
    if (e.startsWith('#')) {
      const eRgb = hexToRgb(e)
      if (eRgb && aStr === eRgb) return `✓ ${e}`
      if (eRgb && aStr.includes(eRgb)) return `✓ ${e}`
      return `✗ ${aStr} (expected ${e} = ${eRgb})`
    }
    return aStr.includes(e) ? `✓ ${e}` : `✗ ${aStr}`
  }
  return String(a)
}

async function run() {
  await mkdir(SHOT_DIR, { recursive: true })

  // Запускаем dev-сервер
  const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    stdio: 'pipe',
    shell: true,
  })

  // Ждём готовности сервера
  let ready = false
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000))
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`)
      if (res.ok) {
        ready = true
        break
      }
    } catch {
      // not ready yet
    }
  }
  if (!ready) {
    console.error('Dev server did not start')
    server.kill()
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(user => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  }, TEST_USER)

  await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))

  const page = await context.newPage()
  await page.clock.setFixedTime('2026-09-23T08:00:00+03:00')

  await page.goto(`http://127.0.0.1:${PORT}/`)
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2000)

  // Ждём карточку темы на Today и кликаем
  const themeCard = page.getByTestId('today-theme-card')
  await themeCard.waitFor({ state: 'visible', timeout: 15000 })
  await themeCard.click()

  await page.waitForSelector('.mx-theme-carousel-q', { timeout: 15000 })
  await page.waitForTimeout(500)

  const results = []

  // === Положение 1: верх (карусель) ===
  console.log('\n=== Положение 1: верх (карусель + CTA) ===')
  for (const spec of SPECS) {
    if (spec.id.startsWith('other') || spec.id.startsWith('all') || spec.id.startsWith('filter') || spec.id === 'surprise') continue
    const m = await measureElement(page, spec.sel, spec.expect)
    results.push({ ...spec, ...m, position: 'top' })
  }
  await page.screenshot({ path: path.join(SHOT_DIR, '01-top.png'), fullPage: false })

  // === Положение 2: «Другие темы» ===
  console.log('\n=== Положение 2: «Другие темы» ===')
  const otherHeading = await page.$('#carousel-other-themes')
  if (otherHeading) {
    await otherHeading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
  }
  for (const spec of SPECS) {
    if (spec.id.startsWith('card') || spec.id === 'header-h1' || spec.id === 'header-h2' || spec.id === 'cta' || spec.id.startsWith('all') || spec.id.startsWith('filter')) continue
    const m = await measureElement(page, spec.sel, spec.expect)
    results.push({ ...spec, ...m, position: 'other' })
  }
  await page.screenshot({ path: path.join(SHOT_DIR, '02-other-themes.png'), fullPage: false })

  // === Положение 3: «Все темы» ===
  console.log('\n=== Положение 3: «Все темы» ===')
  const allHeading = await page.$('#carousel-all-themes')
  if (allHeading) {
    await allHeading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
  }
  for (const spec of SPECS) {
    if (spec.id.startsWith('card') || spec.id === 'header-h1' || spec.id === 'header-h2' || spec.id === 'cta' || spec.id.startsWith('other')) continue
    const m = await measureElement(page, spec.sel, spec.expect)
    results.push({ ...spec, ...m, position: 'all' })
  }
  await page.screenshot({ path: path.join(SHOT_DIR, '03-all-themes.png'), fullPage: false })

  // === Отчёт ===
  console.log('\n\n══════════════════════════════════════════════════════════════')
  console.log('  ТАБЛИЦА ЗАМЕРОВ (viewport 440×956)')
  console.log('══════════════════════════════════════════════════════════════\n')
  console.log(
    'ЭЛЕМЕНТ'.padEnd(28) +
      ' | ' +
      'ЭТАЛОН'.padEnd(16) +
      ' | ' +
      'У НАС'.padEnd(20) +
      ' | СТАТУС'
  )
  console.log('-'.repeat(90))

  for (const r of results) {
    if (!r.found) {
      console.log(`${r.label.padEnd(28)} | ${'(не найден)'.padEnd(16)} | ${'—'.padEnd(20)} | ✗`)
      continue
    }
    const e = r.expect
    const checks = []
    if (e.width !== undefined) checks.push(`w:${formatDiff(r, e, 'width')}`)
    if (e.height !== undefined) checks.push(`h:${formatDiff(r, e, 'height')}`)
    if (e.fontSize !== undefined) checks.push(`fs:${formatDiff(r, e, 'fontSize')}`)
    if (e.fontWeight !== undefined) checks.push(`fw:${formatDiff(r, e, 'fontWeight')}`)
    if (e.fontFamily !== undefined) checks.push(`ff:${formatDiff(r, e, 'fontFamily')}`)
    if (e.color !== undefined) checks.push(`c:${formatDiff(r, e, 'color')}`)
    if (e.bg !== undefined) checks.push(`bg:${formatDiff(r, e, 'bg')}`)
    if (e.radius !== undefined) checks.push(`r:${formatDiff(r, e, 'radius')}`)
    if (e.count !== undefined) checks.push(`n:${formatDiff(r, e, 'count')}`)
    if (e.dotSize !== undefined) checks.push(`dot:${formatDiff(r, e, 'dotSize')}`)
    if (e.gap !== undefined) checks.push(`gap:${formatDiff(r, e, 'gap')}`)
    if (e.size !== undefined) checks.push(`sz:${formatDiff(r, e, 'size')}`)

    const expectStr = Object.entries(e)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
    const actualStr = `w:${r.width} h:${r.height} fs:${r.fontSize} fw:${r.fontWeight}`
    const status = checks.every(c => c.includes('✓')) ? '✓' : '✗'
    console.log(`${r.label.padEnd(28)} | ${expectStr.padEnd(16).slice(0, 16)} | ${actualStr.padEnd(20)} | ${status}`)
    for (const c of checks) {
      if (c.includes('✗')) console.log(`  ${c}`)
    }
  }

  // === Ширина ряда фильтров на 393 ===
  console.log('\n\n=== Ширина ряда фильтров на 393px ===')
  await page.setViewportSize({ width: 393, height: 956 })
  await page.waitForTimeout(300)
  const filterRow = await page.$('.mx-theme-directory__filters')
  if (filterRow) {
    const rect = await filterRow.boundingBox()
    console.log(`Ширина ряда: ${Math.round(rect.width)}px (viewport 393px)`)
    const chips = await page.$$('.mx-theme-directory__filters button')
    for (const chip of chips) {
      const r = await chip.boundingBox()
      const cs = await chip.evaluate(el => getComputedStyle(el))
      console.log(`  чип "${await chip.textContent()}": w=${Math.round(r.width)} fs=${Math.round(parseFloat(cs.fontSize))} pad=${cs.paddingLeft}`)
    }
  }

  console.log(`\nСкриншоты: ${SHOT_DIR}/`)

  await browser.close()
  server.kill()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
