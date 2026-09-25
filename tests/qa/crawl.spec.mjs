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

function isExcludedButton(label) {
  return EXCLUDE_LABELS.some(re => re.test(label))
}

function isExcludedLink(href) {
  return EXCLUDE_HREF.some(re => re.test(href))
}

/**
 * Collects all auto-check issues on the current page. Accumulates without throwing.
 */
async function collectIssues(page, screenName, viewport) {
  const issues = []

  // Console errors + failed requests
  const consoleErrors = await page.evaluate(() => {
    return window.__qaConsoleErrors || []
  }).catch(() => [])

  for (const err of consoleErrors) {
    issues.push({ type: 'console_error', screen: screenName, detail: err })
  }

  const failedRequests = await page.evaluate(() => {
    return window.__qaFailedRequests || []
  }).catch(() => [])

  for (const req of failedRequests) {
    issues.push({ type: 'failed_request', screen: screenName, detail: req })
  }

  // Geometry checks
  const geometry = await page.evaluate(() => {
    const issues = []
    function overlap(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      )
    }
    const scrollEl = document.scrollingElement || document.body
    const innerW = window.innerWidth
    const scrollW = scrollEl.scrollWidth
    if (scrollW > innerW + 1) {
      issues.push({ type: 'horizontal_scroll', detail: `scrollWidth=${scrollW} > innerWidth=${innerW}` })
    }

    // Interactive elements
    const interactives = [...document.querySelectorAll('button, a, [role="button"], input, [role="radio"], [role="checkbox"]')]
    const rects = []
    for (const el of interactives) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      // Only visible elements
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
      const label = el.getAttribute('aria-label') || el.textContent?.trim()?.slice(0, 60) || el.tagName
      rects.push({ label, x: r.x, y: r.y, width: r.width, height: r.height })

      // Smaller than 44x44
      if (r.width < 44 || r.height < 44) {
        issues.push({ type: 'small_tap_target', detail: `«${label}» ${Math.round(r.width)}×${Math.round(r.height)}px` })
      }

      // Off-screen elements (right/bottom edges)
      if (r.x + r.width > innerW + 1) {
        issues.push({ type: 'off_screen_right', detail: `«${label}» right=${Math.round(r.x + r.width)}` })
      }
      if (r.y + r.height < 0) {
        issues.push({ type: 'off_screen_top', detail: `«${label}» top=${Math.round(r.y)}` })
      }
    }

    // Overlapping interactive elements
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (overlap(rects[i], rects[j])) {
          // Only report if both are in viewport
          const a = rects[i], b = rects[j]
          if (a.y >= 0 && b.y >= 0 && a.y < window.innerHeight && b.y < window.innerHeight) {
            issues.push({ type: 'overlap', detail: `«${a.label}» × «${b.label}»` })
          }
        }
      }
    }

    // Truncated text with overflow hidden/ellipsis
    const textEls = [...document.querySelectorAll('p, span, h1, h2, h3, h4, div')]
    for (const el of textEls) {
      if (el.children.length > 0) continue
      const style = getComputedStyle(el)
      if (style.overflow !== 'hidden' && style.textOverflow !== 'ellipsis') continue
      if (el.scrollWidth > el.clientWidth + 1) {
        const text = el.textContent?.trim()?.slice(0, 50) || '(empty)'
        issues.push({ type: 'truncated_text', detail: `«${text}» scrollWidth=${el.scrollWidth} > clientWidth=${el.clientWidth}` })
      }
    }

    return issues
  })

  for (const g of geometry) {
    issues.push({ ...g, screen: screenName, viewport })
  }

  return issues
}

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
    // QA error collection hooks
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
        if (res.status >= 400) {
          window.__qaFailedRequests.push(`HTTP ${res.status}: ${args[0]}`)
        }
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

  // Intercept dialogs
  page.on('dialog', async dialog => {
    const dialogIssues = await page.evaluate(() => window.__qaDialogSeen || [])
    dialogIssues.push(`dialog: ${dialog.type()} "${dialog.message()}"`)
    await page.evaluate(d => { window.__qaDialogSeen = d }, dialogIssues)
    await dialog.dismiss()
  })

  return page
}

async function screenshot(page, viewport, slug, fullPage = false) {
  const relative = `${viewport.name}/${slug}.png`
  const absolute = path.join(SCREENSHOT_ROOT, relative)
  await mkdir(path.dirname(absolute), { recursive: true })
  await page.screenshot({ path: absolute, fullPage })
  return relative.replaceAll('\\', '/')
}

const MAX_BUTTONS_PER_SCREEN = 15
const CLICK_DEADLINE_MS = 30_000

async function clickEveryButton(page, screenName, allIssues) {
  // Collect all clickable elements in one evaluate call (single round-trip)
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

  const deadline = Date.now() + CLICK_DEADLINE_MS
  let clicked = 0

  for (const c of candidates) {
    if (clicked >= MAX_BUTTONS_PER_SCREEN) break
    if (Date.now() > deadline) break

    if (isExcludedButton(c.label)) continue
    if (c.href && isExcludedLink(c.href)) continue

    const urlBefore = page.url()
    const domBefore = await page.evaluate(() => document.body.innerHTML.length)

    try {
      await page.mouse.click(c.x, c.y)
    } catch {
      continue
    }
    clicked++

    await page.waitForTimeout(200)

    const urlAfter = page.url()
    const domAfter = await page.evaluate(() => document.body.innerHTML.length)
    const dialogSeen = await page.evaluate(() => window.__qaDialogSeen || []).catch(() => [])

    for (const d of dialogSeen) {
      allIssues.push({ type: 'dialog', screen: screenName, detail: d })
    }
    await page.evaluate(() => { window.__qaDialogSeen = [] }).catch(() => {})

    if (urlAfter === urlBefore && domAfter === domBefore) {
      allIssues.push({
        type: 'no_change_on_click',
        screen: screenName,
        detail: `«${c.label}» — DOM и URL не изменились`,
      })
    }

    // Restore page state: go back if URL changed, or press Escape to close overlays
    if (urlAfter !== urlBefore) {
      await page.goBack({ timeout: 1500 }).catch(() => {})
    } else if (domAfter !== domBefore) {
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(100)
    }
  }
}

function buildHtmlReport(screens, allIssues) {
  const byType = {}
  for (const issue of allIssues) {
    byType[issue.type] = (byType[issue.type] || 0) + 1
  }

  const summaryTable = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`)
    .join('\n')

  const screenSections = screens.map(s => {
    const shots = s.screenshots.map(
      sq => `<div class="shot"><h4>${sq.viewport}</h4><img src="screens/${sq.path}" /></div>`
    ).join('\n')

    const issues = (s.issues || [])
      .map(i => `<li><span class="type">${i.type}</span> — ${i.detail || ''}</li>`)
      .join('\n')

    return `
      <section class="screen-block">
        <h2>${s.name}</h2>
        <div class="shots">${shots}</div>
        ${issues ? `<ul class="issues">${issues}</ul>` : '<p class="ok">✓ Проблем не найдено</p>'}
      </section>
    `
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

function buildSummaryMd(screens, allIssues) {
  const byType = {}
  for (const issue of allIssues) {
    byType[issue.type] = (byType[issue.type] || 0) + 1
  }

  const typeList = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `- ${type}: ${count}`)
    .join('\n')

  // Top-10 issues with screen name
  const top10 = allIssues
    .slice(0, 10)
    .map(i => `- [${i.type}] ${i.screen}: ${i.detail || ''}`)
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
    `## Топ-10 проблем`,
    top10 || '— нет проблем —',
  ]

  return lines.join('\n')
}

test('QA обход всех экранов', async ({ browser, baseURL }) => {
  test.setTimeout(900_000)

  await rm(ARTIFACT_ROOT, { recursive: true, force: true })
  await mkdir(SCREENSHOT_ROOT, { recursive: true })

  const allScreens = []
  const allIssues = []

  for (const viewport of VIEWPORTS) {
    const context = await setupContext(browser, baseURL, viewport)
    const page = await createPage(context)

    // ─── TODAY (default) ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
    const issues0 = await collectIssues(page, 'Сегодня (default)', viewport)
    allIssues.push(...issues0)
    const shot0 = await screenshot(page, viewport, '01-today-default')
    await clickEveryButton(page, 'Сегодня (default)', allIssues)
    allScreens.push({ name: `Сегодня (default) [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: shot0 }], issues: issues0 })

    // ─── TODAY preview states ───
    for (const state of TODAY_PREVIEW_STATES) {
      await page.goto(`/?today_state=${state}`)
      await page.waitForTimeout(400)
      const issues = await collectIssues(page, `Сегодня (${state})`, viewport)
      allIssues.push(...issues)
      const shot = await screenshot(page, viewport, `01-today-${state}`)
      allScreens.push({ name: `Сегодня — ${state} [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: shot }], issues })
    }

    // ─── MORNING CHECK-IN (each step) ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: /Утренний чек-ин/ }).click()
    await page.waitForTimeout(300)
    const ci1 = await collectIssues(page, 'Чек-ин шаг 1', viewport)
    allIssues.push(...ci1)
    const ciShot1 = await screenshot(page, viewport, '02-checkin-step1')
    allScreens.push({ name: `Чек-ин шаг 1 [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: ciShot1 }], issues: ci1 })

    // Answer first scale question
    const opt1 = page.getByRole('radio', { name: /^3: Нормально$/i })
    if (await opt1.count() > 0) {
      await opt1.click()
      await page.getByRole('button', { name: 'Далее' }).click()
      await page.waitForTimeout(300)
      const ci2 = await collectIssues(page, 'Чек-ин шаг 2', viewport)
      allIssues.push(...ci2)
      const ciShot2 = await screenshot(page, viewport, '02-checkin-step2')
      allScreens.push({ name: `Чек-ин шаг 2 [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: ciShot2 }], issues: ci2 })

      // Answer second scale question
      const opt2 = page.getByRole('radio', { name: /^3: Средне$/i })
      if (await opt2.count() > 0) {
        await opt2.click()
        await page.getByRole('button', { name: 'Далее' }).click()
        await page.waitForTimeout(300)
        const ci3 = await collectIssues(page, 'Чек-ин запись', viewport)
        allIssues.push(...ci3)
        const ciShot3 = await screenshot(page, viewport, '02-checkin-writer')
        allScreens.push({ name: `Чек-ин запись [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: ciShot3 }], issues: ci3 })
      }
    }

    // ─── EVENING REVIEW (Разбор дня) — each step ───
    await page.goto('/?today_state=dayInProgress')
    await page.waitForTimeout(400)
    const eveningCard = page.locator('[data-testid="today-card-evening"]')
    if (await eveningCard.count() > 0) {
      const cardState = await eveningCard.getAttribute('data-state')
      if (cardState === 'active' || cardState === 'done') {
        await eveningCard.click()
        await page.waitForTimeout(400)
        const ev1 = await collectIssues(page, 'Разбор дня шаг 1', viewport)
        allIssues.push(...ev1)
        const evShot1 = await screenshot(page, viewport, '03-evening-step1')
        allScreens.push({ name: `Разбор дня шаг 1 [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: evShot1 }], issues: ev1 })

        // Try to advance through evening review steps
        const reviewOptions = ['Сделал главное', 'Ясность', 'Маленький шаг помогает', 'Начать с пяти минут']
        for (let i = 0; i < reviewOptions.length; i++) {
          const radio = page.getByRole('radio', { name: reviewOptions[i] })
          if (await radio.count() > 0) {
            await radio.click()
            await page.waitForTimeout(200)
            const evShot = await screenshot(page, viewport, `03-evening-step${i + 2}`)
            const evIssues = await collectIssues(page, `Разбор дня шаг ${i + 2}`, viewport)
            allIssues.push(...evIssues)
            allScreens.push({ name: `Разбор дня шаг ${i + 2} [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: evShot }], issues: evIssues })

            const nextBtn = page.getByRole('button', { name: /Дальше|Закрыть день/ })
            if (await nextBtn.count() > 0) {
              await nextBtn.click()
              await page.waitForTimeout(300)
            }
          }
        }
      }
    }

    // ─── STREAK → SERIES SHEET ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
    const streakChip = page.locator('[data-testid="today-streak-chip"]')
    if (await streakChip.count() > 0) {
      await streakChip.click()
      await page.waitForTimeout(400)
      const seriesIssues = await collectIssues(page, 'Шторка серии', viewport)
      allIssues.push(...seriesIssues)
      const seriesShot = await screenshot(page, viewport, '04-series-sheet')
      allScreens.push({ name: `Шторка серии [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: seriesShot }], issues: seriesIssues })
      // Go back
      const backBtn = page.getByRole('button', { name: 'Назад' })
      if (await backBtn.count() > 0) await backBtn.click()
      await page.waitForTimeout(200)
    }

    // ─── PRACTICES TAB ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Шаги' }).click()
    await page.waitForTimeout(300)
    const practicesIssues = await collectIssues(page, 'Практики', viewport)
    allIssues.push(...practicesIssues)
    const practicesShot = await screenshot(page, viewport, '05-practices')
    await clickEveryButton(page, 'Практики', allIssues)
    allScreens.push({ name: `Практики [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: practicesShot }], issues: practicesIssues })

    // ─── ASCESAS ───
    const ascezasCollection = page.locator('.mx-layered-catalog__collection').filter({ hasText: 'Аскезы' })
    if (await ascezasCollection.count() > 0) {
      await ascezasCollection.click()
      await page.waitForTimeout(200)
      const openAscezas = page.getByRole('button', { name: 'Открыть аскезы' })
      if (await openAscezas.count() > 0) {
        await openAscezas.click()
        await page.waitForTimeout(300)
        const ascezasIssues = await collectIssues(page, 'Аскезы', viewport)
        allIssues.push(...ascezasIssues)
        const ascezasShot = await screenshot(page, viewport, '06-ascezas')
        await clickEveryButton(page, 'Аскезы', allIssues)
        allScreens.push({ name: `Аскезы [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: ascezasShot }], issues: ascezasIssues })

        // Click into a practice detail
        const ascezaCards = page.locator('[data-testid], button, a').filter({ hasText: /Без|Не открывать/ })
        if (await ascezaCards.count() > 0) {
          await ascezaCards.first().click()
          await page.waitForTimeout(300)
          const detailIssues = await collectIssues(page, 'Экран практики (аскеза)', viewport)
          allIssues.push(...detailIssues)
          const detailShot = await screenshot(page, viewport, '07-practice-detail-asceza')
          allScreens.push({ name: `Экран практики (аскеза) [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: detailShot }], issues: detailIssues })

          // Expand accordions
          for (const testId of ['practice-accordion-why', 'practice-accordion-how', 'practice-accordion-note']) {
            const acc = page.locator(`[data-testid="${testId}"]`)
            if (await acc.count() > 0) {
              await acc.click()
              await page.waitForTimeout(200)
            }
          }
          const accordionShot = await screenshot(page, viewport, '07b-practice-detail-expanded')
          const accordionIssues = await collectIssues(page, 'Экран практики (раскрытый)', viewport)
          allIssues.push(...accordionIssues)
          allScreens.push({ name: `Экран практики (раскрытый) [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: accordionShot }], issues: accordionIssues })

          const backBtn = page.getByRole('button', { name: 'Назад' })
          if (await backBtn.count() > 0) await backBtn.click()
          await page.waitForTimeout(200)
        }
      }
    }

    // ─── RITUALS ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).click()
    await page.waitForTimeout(300)
    const ritualsCollection = page.locator('.mx-layered-catalog__collection').filter({ hasText: 'Ритуалы' })
    if (await ritualsCollection.count() > 0) {
      await ritualsCollection.click()
      await page.waitForTimeout(200)
      const openRituals = page.getByRole('button', { name: 'Открыть ритуалы' })
      if (await openRituals.count() > 0) {
        await openRituals.click()
        await page.waitForTimeout(300)
        const ritualsIssues = await collectIssues(page, 'Ритуалы', viewport)
        allIssues.push(...ritualsIssues)
        const ritualsShot = await screenshot(page, viewport, '08-rituals')
        await clickEveryButton(page, 'Ритуалы', allIssues)
        allScreens.push({ name: `Ритуалы [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: ritualsShot }], issues: ritualsIssues })

        // Click into a ritual practice detail
        const ritualCards = page.locator('button, a').filter({ hasText: /Утренний спорт|Стакан воды|Три минуты/ })
        if (await ritualCards.count() > 0) {
          await ritualCards.first().click()
          await page.waitForTimeout(300)
          const rDetailIssues = await collectIssues(page, 'Экран практики (ритуал)', viewport)
          allIssues.push(...rDetailIssues)
          const rDetailShot = await screenshot(page, viewport, '09-practice-detail-ritual')
          allScreens.push({ name: `Экран практики (ритуал) [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: rDetailShot }], issues: rDetailIssues })

          // Expand accordions
          for (const testId of ['practice-accordion-why', 'practice-accordion-how', 'practice-accordion-note']) {
            const acc = page.locator(`[data-testid="${testId}"]`)
            if (await acc.count() > 0) {
              await acc.click()
              await page.waitForTimeout(200)
            }
          }
          const rAccordionShot = await screenshot(page, viewport, '09b-practice-detail-ritual-expanded')
          const rAccordionIssues = await collectIssues(page, 'Экран практики (ритуал, раскрытый)', viewport)
          allIssues.push(...rAccordionIssues)
          allScreens.push({ name: `Экран практики (ритуал, раскрытый) [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: rAccordionShot }], issues: rAccordionIssues })

          const backBtn = page.getByRole('button', { name: 'Назад' })
          if (await backBtn.count() > 0) await backBtn.click()
          await page.waitForTimeout(200)
        }
      }
    }

    // ─── MOOD PRACTICE (Настроение) — each step ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).click()
    await page.waitForTimeout(300)
    // Try to find mood practice entry
    const moodEntry = page.getByText('Настроение', { exact: false }).first()
    if (await moodEntry.count() > 0) {
      try {
        await moodEntry.click()
        await page.waitForTimeout(300)

        // Intro screen
        const moodIntro = page.locator('[data-testid="mood-practice-intro"]')
        if (await moodIntro.count() > 0) {
          const moodIntroIssues = await collectIssues(page, 'Настроение — интро', viewport)
          allIssues.push(...moodIntroIssues)
          const moodIntroShot = await screenshot(page, viewport, '10-mood-intro')
          allScreens.push({ name: `Настроение — интро [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: moodIntroShot }], issues: moodIntroIssues })

          const startBtn = page.locator('[data-testid="mood-practice-start"]')
          if (await startBtn.count() > 0) {
            await startBtn.click()
            await page.waitForTimeout(300)
          }
        }

        // Step screen
        const moodStep = page.locator('[data-testid="mood-practice-step"]')
        if (await moodStep.count() > 0) {
          const moodStepIssues = await collectIssues(page, 'Настроение — шаг', viewport)
          allIssues.push(...moodStepIssues)
          const moodStepShot = await screenshot(page, viewport, '11-mood-step')
          allScreens.push({ name: `Настроение — шаг [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: moodStepShot }], issues: moodStepIssues })
        }

        // Completion screen
        const moodDone = page.locator('[data-testid="mood-practice-completion"]')
        if (await moodDone.count() > 0) {
          const moodDoneIssues = await collectIssues(page, 'Настроение — завершение', viewport)
          allIssues.push(...moodDoneIssues)
          const moodDoneShot = await screenshot(page, viewport, '12-mood-completion')
          allScreens.push({ name: `Настроение — завершение [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: moodDoneShot }], issues: moodDoneIssues })
        }
      } catch {
        // mood practice not reachable in this state
      }
    }

    // ─── DIALOG TAB ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Диалог' }).click()
    await page.waitForTimeout(300)
    const dialogIssues = await collectIssues(page, 'Диалог', viewport)
    allIssues.push(...dialogIssues)
    const dialogShot = await screenshot(page, viewport, '13-dialog')
    await clickEveryButton(page, 'Диалог', allIssues)
    allScreens.push({ name: `Диалог [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: dialogShot }], issues: dialogIssues })

    // ─── LIBRARY TAB ───
    await page.getByRole('button', { name: 'Библиотека' }).click()
    await page.waitForTimeout(300)
    const libraryIssues = await collectIssues(page, 'Библиотека', viewport)
    allIssues.push(...libraryIssues)
    const libraryShot = await screenshot(page, viewport, '14-library')
    await clickEveryButton(page, 'Библиотека', allIssues)
    allScreens.push({ name: `Библиотека [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: libraryShot }], issues: libraryIssues })

    // ─── PROGRESS/ANALYTICS TAB ───
    await page.getByRole('button', { name: 'Прогресс' }).click()
    await page.waitForTimeout(300)
    const progressIssues = await collectIssues(page, 'Прогресс', viewport)
    allIssues.push(...progressIssues)
    const progressShot = await screenshot(page, viewport, '15-progress')
    await clickEveryButton(page, 'Прогресс', allIssues)
    allScreens.push({ name: `Прогресс [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: progressShot }], issues: progressIssues })

    // ─── HISTORY (full page) ───
    // History is accessed via Progress tab's onOpenHistory
    const historyBtn = page.getByRole('button', { name: 'История' }).first()
    if (await historyBtn.count() > 0) {
      await historyBtn.click()
      await page.waitForTimeout(300)
    } else {
      // Navigate via URL
      await page.goto('/?tab=history')
      await page.waitForTimeout(300)
    }
    const historyIssues = await collectIssues(page, 'История', viewport)
    allIssues.push(...historyIssues)
    const historyShot = await screenshot(page, viewport, '16-history', true)
    allScreens.push({ name: `История [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: historyShot }], issues: historyIssues })

    // ─── PROFILE (full page) ───
    await page.goto('/')
    await page.getByRole('button', { name: 'Шаги' }).waitFor({ state: 'visible' })
    const profileBtn = page.locator('[data-testid="today-profile-button"]')
    if (await profileBtn.count() > 0) {
      await profileBtn.click()
      await page.waitForTimeout(300)
    }
    const profileIssues = await collectIssues(page, 'Профиль', viewport)
    allIssues.push(...profileIssues)
    const profileShot = await screenshot(page, viewport, '17-profile', true)
    await clickEveryButton(page, 'Профиль', allIssues)
    allScreens.push({ name: `Профиль [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: profileShot }], issues: profileIssues })

    // ─── о тебе. ───
    const aboutRow = page.locator('[data-testid="profile-row-about"]')
    if (await aboutRow.count() > 0) {
      await aboutRow.click()
      await page.waitForTimeout(300)
      const aboutIssues = await collectIssues(page, 'о тебе.', viewport)
      allIssues.push(...aboutIssues)
      const aboutShot = await screenshot(page, viewport, '18-about', true)
      allScreens.push({ name: `о тебе. [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: aboutShot }], issues: aboutIssues })

      // Go back to profile root
      const backBtn = page.getByRole('button', { name: /Назад|твой профиль/ })
      if (await backBtn.count() > 0) await backBtn.first().click()
      await page.waitForTimeout(200)
    }

    // ─── подписка. ───
    const profileScreen2 = page.locator('[data-testid="profile-screen"]')
    if (await profileScreen2.count() > 0) {
      // Try to find subscription entry
      const subRow = page.getByText('подписка', { exact: false }).first()
      if (await subRow.count() > 0) {
        try {
          await subRow.click()
          await page.waitForTimeout(300)
          const subIssues = await collectIssues(page, 'подписка.', viewport)
          allIssues.push(...subIssues)
          const subShot = await screenshot(page, viewport, '19-subscription', true)
          allScreens.push({ name: `подписка. [${viewport.name}]`, screenshots: [{ viewport: viewport.name, path: subShot }], issues: subIssues })
        } catch {
          // subscription not reachable
        }
      }
    }

    await context.close()
  }

  // ─── Generate reports ───
  const html = buildHtmlReport(allScreens, allIssues)
  await writeFile(path.join(ARTIFACT_ROOT, 'index.html'), html, 'utf8')

  const summary = buildSummaryMd(allScreens, allIssues)
  await writeFile(path.join(ARTIFACT_ROOT, 'summary.md'), summary, 'utf8')

  // QA crawl is informational — never fail CI
  console.log(`\nQA обход завершён: ${allScreens.length} экранов, ${allIssues.length} проблем`)
})
