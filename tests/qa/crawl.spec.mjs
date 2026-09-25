import { test } from '@playwright/test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  TEST_USER,
  QA_FIXED_TIME,
  TODAY_PREVIEW_STATES,
  VIEWPORTS,
  fixtureFor,
  freezePageTime,
  sanitizeReason,
} from './fixtures.mjs'

const ARTIFACT_ROOT = path.resolve('qa-report')
const SCREENSHOT_ROOT = path.join(ARTIFACT_ROOT, 'screens')

const EXCLUDE_LABELS = [
  /удалить/i,
  /сорвался/i,
  /выйти/i,
  /сброс/i,
  /отмена подписки/i,
  /отписаться/i,
]

const EXCLUDE_HREF = [/^t\.me\//, /^https?:\/\/(?!127\.0\.0\.1:4173)/]

/** Main-button labels we care about (navigation, cards, key actions, tabs). */
const MAIN_BUTTON_PATTERNS = [
  /шаги/i, /диалог/i, /библиотека/i, /прогресс/i,
  /начать/i, /далее/i, /дальше/i, /закрыть день/i,
  /назад/i, /открыть/i,
]

function isExcludedButton(label) {
  return EXCLUDE_LABELS.some(re => re.test(label))
}

function isExcludedLink(href) {
  return EXCLUDE_HREF.some(re => re.test(href))
}

function isMainButton(label) {
  return MAIN_BUTTON_PATTERNS.some(re => re.test(label))
}

// ─── Auto-checks ──────────────────────────────────────────────

async function collectIssues(page, screenName, viewport) {
  const issues = []

  // Console errors + failed requests (collected via init hooks)
  const consoleErrors = await page.evaluate(() => window.__qaConsoleErrors || []).catch(() => [])
  for (const err of consoleErrors) issues.push({ type: 'console_error', screen: screenName, detail: err })

  const failedRequests = await page.evaluate(() => window.__qaFailedRequests || []).catch(() => [])
  for (const req of failedRequests) issues.push({ type: 'failed_request', screen: screenName, detail: req })

  // Geometry checks (all in one evaluate round-trip)
  const geometry = await page.evaluate(() => {
    const issues = []
    const innerW = window.innerWidth
    const innerH = window.innerHeight
    const scrollEl = document.scrollingElement || document.body

    function overlap(a, b) {
      return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    }

    // 1. Horizontal scroll
    if (scrollEl.scrollWidth > innerW + 1) {
      issues.push({ type: 'horizontal_scroll', detail: `scrollWidth=${scrollEl.scrollWidth} > innerWidth=${innerW}` })
    }

    // Collect interactive element rects
    const interactives = [...document.querySelectorAll('button, a, [role="button"], input, [role="radio"], [role="checkbox"]')]
    const rects = []
    for (const el of interactives) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
      const label = el.getAttribute('aria-label') || el.textContent?.trim()?.slice(0, 60) || el.tagName
      const isFixed = (function isInsideFixed(node) {
        let n = node
        while (n && n !== document.body) {
          if (getComputedStyle(n).position === 'fixed') return true
          n = n.parentElement
        }
        return false
      })(el)
      rects.push({ label, x: r.x, y: r.y, width: r.width, height: r.height, fixed: isFixed })

      // 2. Small tap target (< 43×43) — account for ::before/::after tap area
      let tapW = r.width
      let tapH = r.height
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(el, pseudo)
        if (!ps.content || ps.content === 'none' || ps.content === 'normal') continue
        const pw = parseFloat(ps.width) || 0
        const ph = parseFloat(ps.height) || 0
        if (pw > tapW) tapW = pw
        if (ph > tapH) tapH = ph
      }
      if (tapW < 43 || tapH < 43) {
        issues.push({ type: 'small_tap_target', detail: `«${label}» ${Math.round(tapW)}×${Math.round(tapH)}px` })
      }

      // 3. Off-screen right
      if (r.x + r.width > innerW + 1) {
        issues.push({ type: 'off_screen_right', detail: `«${label}» right=${Math.round(r.x + r.width)}` })
      }
      // 4. Off-screen top
      if (r.y + r.height < 0) {
        issues.push({ type: 'off_screen_top', detail: `«${label}» top=${Math.round(r.y)}` })
      }

      // 5. Edge padding 21px — header-area elements too close to screen edge
      if (r.y < 70 && r.width < innerW * 0.9) {
        if (r.x < 21) issues.push({ type: 'edge_padding_21', detail: `«${label}» left=${Math.round(r.x)}px (< 21)` })
        if (r.x + r.width > innerW - 21 + 1) {
          issues.push({ type: 'edge_padding_21', detail: `«${label}» right=${Math.round(r.x + r.width)}px (> ${innerW - 21})` })
        }
      }
    }

    // 6. Overlapping interactive elements — only non-fixed vs non-fixed
    //    (content scrolling under fixed nav/header is by design, not a bug)
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j]
        if (a.fixed || b.fixed) continue
        if (a.y >= 0 && b.y >= 0 && a.y < innerH && b.y < innerH && overlap(a, b)) {
          issues.push({ type: 'overlap', detail: `«${a.label}» × «${b.label}»` })
        }
      }
    }

    // 7. Truncated text (overflow hidden/ellipsis with content overflow)
    const textEls = [...document.querySelectorAll('p, span, h1, h2, h3, h4, div')]
    for (const el of textEls) {
      if (el.children.length > 0) continue
      // Skip hidden/invisible elements
      if (el.getAttribute('aria-hidden') === 'true') continue
      if (el.classList.contains('sr-only')) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') continue
      if (el.clientWidth <= 2) continue
      if (style.overflow !== 'hidden' && style.textOverflow !== 'ellipsis') continue
      if (el.scrollWidth > el.clientWidth + 1) {
        const text = el.textContent?.trim()?.slice(0, 50) || '(empty)'
        issues.push({ type: 'truncated_text', detail: `«${text}» scrollWidth=${el.scrollWidth} > clientWidth=${el.clientWidth}` })
      }
    }

    return issues
  }).catch(() => [])

  for (const g of geometry) issues.push({ ...g, screen: screenName, viewport })
  return issues
}

// ─── Context setup ─────────────────────────────────────────────

async function setupContext(browser, baseURL, viewport) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: viewport.width, height: viewport.height },
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
    window.__qaConsoleErrors = []
    window.__qaFailedRequests = []
    window.addEventListener('error', e => {
      window.__qaConsoleErrors.push(`pageerror: ${e.message}`)
    })
    const origError = console.error.bind(console)
    console.error = function (...args) {
      const text = args.map(a => String(a)).join(' ')
      if (!text.includes('CloudStorage is not supported')) {
        window.__qaConsoleErrors.push(`console.error: ${text.slice(0, 200)}`)
      }
      origError(...args)
    }
    const origFetch = window.fetch.bind(window)
    window.fetch = function (...args) {
      return origFetch(...args).then(res => {
        if (res.status >= 400) window.__qaFailedRequests.push(`HTTP ${res.status}: ${args[0]}`)
        return res
      }).catch(err => {
        window.__qaFailedRequests.push(`network: ${String(err).slice(0, 120)}`)
        throw err
      })
    }
  }, TEST_USER)

  await context.route('**/api/**', route => route.fulfill(fixtureFor(route.request())))
  return context
}

async function createPage(context) {
  const page = await context.newPage()
  await freezePageTime(page)
  page.setDefaultTimeout(5_000)
  page.on('dialog', async dialog => { await dialog.dismiss() })
  return page
}

// ─── Screenshot helper ─────────────────────────────────────────

async function screenshot(page, viewport, slug, fullPage = false) {
  const relative = `${viewport.name}/${slug}.png`
  const absolute = path.join(SCREENSHOT_ROOT, relative)
  await mkdir(path.dirname(absolute), { recursive: true })
  await page.screenshot({ path: absolute, fullPage })
  return relative.replaceAll('\\', '/')
}

// ─── Main-button clicker (max 8, only key buttons) ────────────

const MAX_MAIN_BUTTONS = 8

async function clickMainButtons(page, screenName, allIssues) {
  const candidates = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button, a, [role="button"]')]
    return els
      .filter(el => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return false
        const s = getComputedStyle(el)
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'
      })
      .map(el => {
        const r = el.getBoundingClientRect()
        return {
          label: (el.getAttribute('aria-label') || el.textContent?.trim()?.slice(0, 80) || el.tagName),
          href: el.getAttribute('href') || '',
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
        }
      })
  }).catch(() => [])

  let clicked = 0
  for (const c of candidates) {
    if (clicked >= MAX_MAIN_BUTTONS) break
    if (isExcludedButton(c.label)) continue
    if (c.href && isExcludedLink(c.href)) continue
    if (!isMainButton(c.label)) continue

    const urlBefore = page.url()
    try {
      await page.mouse.click(c.x, c.y)
    } catch { continue }
    clicked++
    await page.waitForTimeout(100)

    const urlAfter = page.url()
    if (urlAfter !== urlBefore) {
      await page.goBack({ timeout: 2000 }).catch(() => {})
    } else {
      await page.keyboard.press('Escape').catch(() => {})
    }
    await page.waitForTimeout(100)
  }
}

// ─── Screen visitor with per-screen timeout ────────────────────

/**
 * Visits one screen: navigate → collect issues → screenshot → click main buttons.
 * Wrapped in try/catch — never throws, records timeout/stuck as issue.
 */
async function visitScreen(page, viewport, slug, screenName, allScreens, allIssues, {
  navigate,
  fullPage = false,
  click = true,
} = {}) {
  const screenStart = Date.now()
  try {
    await navigate()
    await page.waitForTimeout(150)
    const issues = await collectIssues(page, screenName, viewport.name)
    allIssues.push(...issues)
    const shot = await screenshot(page, viewport, slug, fullPage)
    if (click) await clickMainButtons(page, screenName, allIssues)
    allScreens.push({ name: `${screenName} [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: shot }], issues })
  } catch (e) {
    const elapsed = Math.round((Date.now() - screenStart) / 1000)
    allIssues.push({ type: 'screen_stuck', screen: screenName, detail: `${sanitizeReason(e)} (${elapsed}s)` })
    // Try to screenshot even if stuck
    try {
      const shot = await screenshot(page, viewport, slug, fullPage)
      allScreens.push({ name: `${screenName} [${viewport.name}] (stuck)`, screenshots: [{ viewport: viewport.name, path: shot }], issues: [] })
    } catch {
      allScreens.push({ name: `${screenName} [${viewport.name}] (failed)`, screenshots: [], issues: [] })
    }
  }
}

// ─── Report builders ───────────────────────────────────────────

function buildHtmlReport(screens, allIssues) {
  const byType = {}
  for (const issue of allIssues) byType[issue.type] = (byType[issue.type] || 0) + 1

  const summaryTable = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`)
    .join('\n')

  const screenSections = screens.map(s => {
    const shots = s.screenshots.map(sq => `<div class="shot"><h4>${sq.viewport}</h4><img src="screens/${sq.path}" /></div>`).join('\n')
    const issues = (s.issues || []).map(i => `<li><span class="type">${i.type}</span> — ${i.detail || ''}</li>`).join('\n')
    return `
      <section class="screen-block">
        <h2>${s.name}</h2>
        <div class="shots">${shots}</div>
        ${issues ? `<ul class="issues">${issues}</ul>` : '<p class="ok">✓ Проблем не найдено</p>'}
      </section>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>QA обход — Mentalix</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #1a1a2e; color: #e0e0e0; margin: 0; padding: 20px; }
  h1 { font-size: 24px; }
  h2 { border-bottom: 1px solid #444; padding-bottom: 6px; margin-top: 40px; }
  .summary { margin: 20px 0; }
  .summary table { border-collapse: collapse; }
  .summary th, .summary td { border: 1px solid #555; padding: 6px 12px; }
  .shots { display: flex; gap: 20px; margin: 12px 0; flex-wrap: wrap; }
  .shot h4 { margin: 0 0 4px; font-size: 13px; color: #aaa; }
  .shot img { max-width: 393px; border: 1px solid #444; border-radius: 8px; }
  .issues { padding-left: 20px; }
  .issues li { margin: 4px 0; }
  .type { font-weight: bold; color: #ff9e64; }
  .ok { color: #6FB7E0; }
  .screen-block { margin-bottom: 40px; }
</style>
</head>
<body>
<h1>QA обход Mentalix</h1>
<p>Экранов: ${screens.length} · Проблем: ${allIssues.length}</p>
<div class="summary">
  <h2>Сводка по типам проблем</h2>
  <table>
    <thead><tr><th>Тип</th><th>Количество</th></tr></thead>
    <tbody>${summaryTable || '<tr><td colspan="2">Нет проблем</td></tr>'}</tbody>
  </table>
</div>
${screenSections}
</body>
</html>`
}

/** Extract base screen name (strip state suffix like " — checkinPending" or " (default)"). */
function baseScreenName(screen) {
  return screen.replace(/\s*[—-]\s*\S+$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
}

/** Collapse identical issues (same type+detail) across states of the same base screen. */
function collapseIssues(issues) {
  const map = new Map()
  for (const i of issues) {
    const key = `${i.type}||${i.detail || ''}`
    if (!map.has(key)) {
      map.set(key, { ...i, screens: [i.screen], count: 1 })
    } else {
      const entry = map.get(key)
      if (!entry.screens.includes(i.screen)) entry.screens.push(i.screen)
      entry.count++
    }
  }
  return [...map.values()]
}

function buildSummaryMd(screens, allIssues) {
  const byType = {}
  for (const issue of allIssues) byType[issue.type] = (byType[issue.type] || 0) + 1

  const typeList = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `- ${type}: ${count}`)
    .join('\n')

  // Collapse duplicates for the top section
  const collapsed = collapseIssues(allIssues)
  const topIssues = collapsed.slice(0, 20)
    .map(i => {
      const screenStr = i.screens.length > 1
        ? `${baseScreenName(i.screens[0])} (×${i.screens.length} состояний)`
        : i.screens[0]
      return `- [${i.type}] ${screenStr}: ${i.detail || ''}`
    })
    .join('\n')

  // "Требует внимания" — ALL critical issues with full detail
  const ATTENTION_TYPES = ['console_error', 'failed_request', 'screen_stuck', 'off_screen_right', 'edge_padding_21']
  const attentionIssues = collapseIssues(allIssues.filter(i => ATTENTION_TYPES.includes(i.type)))
  const attentionList = attentionIssues
    .map(i => {
      const screenStr = i.screens.length > 1
        ? `${baseScreenName(i.screens[0])} (×${i.screens.length})`
        : i.screens[0]
      return `- [${i.type}] ${screenStr}: ${i.detail || ''}`
    })
    .join('\n')

  const lines = [
    `# QA обход — сводка`,
    ``,
    `Экранов проверено: ${screens.length}`,
    `Всего проблем: ${allIssues.length}`,
    `Вьюпорты: ${VIEWPORTS.map(v => v.name).join(', ')}`,
    `Время: ${QA_FIXED_TIME}`,
    ``,
    `## Проблемы по типам`,
    typeList || '— нет проблем —',
    ``,
    `## Топ-20 проблем`,
    topIssues || '— нет проблем —',
    ``,
    `## Требует внимания`,
    attentionList || '— нет критических проблем —',
  ]
  return lines.join('\n')
}

// ─── Main test ─────────────────────────────────────────────────

test('QA обход всех экранов', async ({ browser, baseURL }) => {
  test.setTimeout(480_000) // 8 минут

  await rm(ARTIFACT_ROOT, { recursive: true, force: true })
  await mkdir(SCREENSHOT_ROOT, { recursive: true })

  const allScreens = []
  const allIssues = []

  for (const viewport of VIEWPORTS) {
    const context = await setupContext(browser, baseURL, viewport)
    const page = await createPage(context)

    // ─── TODAY (default) ───
    await visitScreen(page, viewport, '01-today-default', 'Сегодня (default)', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
      },
    })

    // ─── TODAY preview states ───
    for (const state of TODAY_PREVIEW_STATES) {
      await visitScreen(page, viewport, `01-today-${state}`, `Сегодня — ${state}`, allScreens, allIssues, {
        navigate: async () => { await page.goto(`/?today_state=${state}`) },
        click: false,
      })
    }

    // ─── MORNING CHECK-IN ───
    await visitScreen(page, viewport, '02-checkin-step1', 'Чек-ин шаг 1', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
        await page.getByRole('button', { name: /Утренний чек-ин/ }).click()
      },
    })

    // Check-in step 2
    await visitScreen(page, viewport, '02-checkin-step2', 'Чек-ин шаг 2', allScreens, allIssues, {
      navigate: async () => {
        const opt = page.getByRole('radio', { name: /^3: Нормально$/i })
        if (await opt.count() > 0) {
          await opt.click()
          await page.getByRole('button', { name: 'Далее' }).click()
        }
      },
      click: false,
    })

    // Check-in writer
    await visitScreen(page, viewport, '02-checkin-writer', 'Чек-ин запись', allScreens, allIssues, {
      navigate: async () => {
        const opt = page.getByRole('radio', { name: /^3: Средне$/i })
        if (await opt.count() > 0) {
          await opt.click()
          await page.getByRole('button', { name: 'Далее' }).click()
        }
      },
      click: false,
    })

    // ─── EVENING REVIEW ───
    await visitScreen(page, viewport, '03-evening-step1', 'Разбор дня шаг 1', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/?today_state=dayInProgress')
        await page.waitForTimeout(150)
        const card = page.locator('[data-testid="today-card-evening"]')
        if (await card.count() > 0) await card.click()
      },
      click: false,
    })

    // Evening review steps 2-5
    const reviewOptions = ['Сделал главное', 'Ясность', 'Маленький шаг помогает', 'Начать с пяти минут']
    for (let i = 0; i < reviewOptions.length; i++) {
      await visitScreen(page, viewport, `03-evening-step${i + 2}`, `Разбор дня шаг ${i + 2}`, allScreens, allIssues, {
        navigate: async () => {
          const radio = page.getByRole('radio', { name: reviewOptions[i] })
          if (await radio.count() > 0) {
            await radio.click()
            await page.waitForTimeout(100)
            const next = page.getByRole('button', { name: /Дальше|Закрыть день/ })
            if (await next.count() > 0) await next.click()
          }
        },
        click: false,
      })
    }

    // ─── STREAK / SERIES SHEET ───
    await visitScreen(page, viewport, '04-series-sheet', 'Шторка серии', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
        const chip = page.locator('[data-testid="today-streak-chip"]')
        if (await chip.count() > 0) await chip.click()
      },
      click: false,
    })

    // ─── PRACTICES TAB ───
    await visitScreen(page, viewport, '05-practices', 'Практики', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
        await page.getByRole('button', { name: 'Шаги' }).click()
      },
    })

    // ─── ASCESAS ───
    await visitScreen(page, viewport, '06-ascezas', 'Аскезы', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).click()
        await page.waitForTimeout(100)
        const col = page.locator('.mx-layered-catalog__collection').filter({ hasText: 'Аскезы' })
        if (await col.count() > 0) await col.click()
        await page.waitForTimeout(100)
        const open = page.getByRole('button', { name: 'Открыть аскезы' })
        if (await open.count() > 0) await open.click()
      },
    })

    // Practice detail (asceza)
    await visitScreen(page, viewport, '07-practice-detail-asceza', 'Экран практики (аскеза)', allScreens, allIssues, {
      navigate: async () => {
        const card = page.locator('[data-testid], button, a').filter({ hasText: /Без|Не открывать/ })
        if (await card.count() > 0) await card.first().click()
      },
      click: false,
    })

    // Practice detail expanded
    await visitScreen(page, viewport, '07b-practice-detail-expanded', 'Экран практики (раскрытый)', allScreens, allIssues, {
      navigate: async () => {
        for (const tid of ['practice-accordion-why', 'practice-accordion-how', 'practice-accordion-note']) {
          const acc = page.locator(`[data-testid="${tid}"]`)
          if (await acc.count() > 0) await acc.click()
          await page.waitForTimeout(100)
        }
      },
      click: false,
    })

    // ─── RITUALS ───
    await visitScreen(page, viewport, '08-rituals', 'Ритуалы', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).click()
        await page.waitForTimeout(100)
        const col = page.locator('.mx-layered-catalog__collection').filter({ hasText: 'Ритуалы' })
        if (await col.count() > 0) await col.click()
        await page.waitForTimeout(100)
        const open = page.getByRole('button', { name: 'Открыть ритуалы' })
        if (await open.count() > 0) await open.click()
      },
    })

    // Ritual practice detail
    await visitScreen(page, viewport, '09-practice-detail-ritual', 'Экран практики (ритуал)', allScreens, allIssues, {
      navigate: async () => {
        const card = page.locator('button, a').filter({ hasText: /Утренний спорт|Стакан воды|Три минуты/ })
        if (await card.count() > 0) await card.first().click()
      },
      click: false,
    })

    // Ritual detail expanded
    await visitScreen(page, viewport, '09b-practice-detail-ritual-expanded', 'Экран практики (ритуал, раскрытый)', allScreens, allIssues, {
      navigate: async () => {
        for (const tid of ['practice-accordion-why', 'practice-accordion-how', 'practice-accordion-note']) {
          const acc = page.locator(`[data-testid="${tid}"]`)
          if (await acc.count() > 0) await acc.click()
          await page.waitForTimeout(100)
        }
      },
      click: false,
    })

    // ─── MOOD PRACTICE ───
    await visitScreen(page, viewport, '10-mood-intro', 'Настроение — интро', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).click()
        await page.waitForTimeout(100)
        const mood = page.getByText('Настроение', { exact: false }).first()
        if (await mood.count() > 0) await mood.click()
      },
      click: false,
    })

    await visitScreen(page, viewport, '11-mood-step', 'Настроение — шаг', allScreens, allIssues, {
      navigate: async () => {
        const start = page.locator('[data-testid="mood-practice-start"]')
        if (await start.count() > 0) await start.click()
      },
      click: false,
    })

    await visitScreen(page, viewport, '12-mood-completion', 'Настроение — завершение', allScreens, allIssues, {
      navigate: async () => {
        // Wait for completion screen to appear naturally
        await page.waitForTimeout(200)
      },
      click: false,
    })

    // ─── DIALOG TAB ───
    await visitScreen(page, viewport, '13-dialog', 'Диалог', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
        await page.getByRole('button', { name: 'Диалог' }).click()
      },
    })

    // ─── LIBRARY TAB ───
    await visitScreen(page, viewport, '14-library', 'Библиотека', allScreens, allIssues, {
      navigate: async () => {
        await page.getByRole('button', { name: 'Библиотека' }).click()
      },
    })

    // ─── PROGRESS TAB ───
    await visitScreen(page, viewport, '15-progress', 'Прогресс', allScreens, allIssues, {
      navigate: async () => {
        await page.getByRole('button', { name: 'Прогресс' }).click()
      },
    })

    // ─── HISTORY ───
    await visitScreen(page, viewport, '16-history', 'История', allScreens, allIssues, {
      navigate: async () => {
        const btn = page.getByRole('button', { name: 'История' }).first()
        if (await btn.count() > 0) await btn.click()
        else await page.goto('/?tab=history')
      },
      fullPage: true,
      click: false,
    })

    // ─── PROFILE ───
    await visitScreen(page, viewport, '17-profile', 'Профиль', allScreens, allIssues, {
      navigate: async () => {
        await page.goto('/')
        await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
        const btn = page.locator('[data-testid="today-profile-button"]')
        if (await btn.count() > 0) await btn.click()
      },
      fullPage: true,
    })

    // ─── о тебе. ───
    await visitScreen(page, viewport, '18-about', 'о тебе.', allScreens, allIssues, {
      navigate: async () => {
        const row = page.locator('[data-testid="profile-row-about"]')
        if (await row.count() > 0) await row.click()
      },
      fullPage: true,
      click: false,
    })

    // ─── подписка. ───
    await visitScreen(page, viewport, '19-subscription', 'подписка.', allScreens, allIssues, {
      navigate: async () => {
        // Go back to profile first
        const back = page.getByRole('button', { name: /Назад|твой профиль/ })
        if (await back.count() > 0) await back.first().click()
        await page.waitForTimeout(100)
        const sub = page.getByText('подписка', { exact: false }).first()
        if (await sub.count() > 0) await sub.click()
      },
      fullPage: true,
      click: false,
    })

    await context.close()
  }

  // ─── Generate reports ───
  const html = buildHtmlReport(allScreens, allIssues)
  await writeFile(path.join(ARTIFACT_ROOT, 'index.html'), html, 'utf8')

  const summary = buildSummaryMd(allScreens, allIssues)
  await writeFile(path.join(ARTIFACT_ROOT, 'summary.md'), summary, 'utf8')

  console.log(`\nQA обход завершён: ${allScreens.length} экранов, ${allIssues.length} проблем`)
})
