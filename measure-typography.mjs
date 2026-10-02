import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:5173'
const VP = { width: 440, height: 956 }

const results = []

async function measure(page, label, selector) {
  try {
    const el = await page.$(selector)
    if (!el) {
      results.push({ label, selector, found: false })
      return
    }
    const cs = await el.evaluate((e) => {
      const s = getComputedStyle(e)
      return {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        fontFamily: s.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
        letterSpacing: s.letterSpacing,
      }
    })
    results.push({ label, selector, found: true, ...cs })
  } catch (err) {
    results.push({ label, selector, found: false, error: err.message })
  }
}

async function visitTab(page, tab) {
  await page.goto(`${BASE}/?demo=1&tab=${tab}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: VP, colorScheme: 'dark', serviceWorkers: 'block' })
const page = await ctx.newPage()

// Mock API to avoid waiting for real data
await page.route('**/api/**', async (route) => {
  const url = new URL(route.request().url())
  const mocks = {
    '/api/streak': { current_streak: 4, longest_streak: 9, total_active_days: 20, is_active_today: true },
    '/api/profile/settings': { review_hour: 21 },
    '/api/checkin/today': null,
    '/api/analytics/pulse': { active_today: 2 },
    '/api/profile': { id: 900001, first_name: 'Loop' },
  }
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mocks[url.pathname] ?? []) })
})

// === TODAY ===
await visitTab(page, 'today')
await measure(page, 'TODAY: greeting (шапка)', '.mx-demo-today-greeting')
await measure(page, 'TODAY: streak number', '.mx-demo-today-streak strong')
await measure(page, 'TODAY: weekday (Пн)', '.mx-today-week-day .mx-type-weekday')
await measure(page, 'TODAY: calendar date (16)', '.mx-today-week-day .mx-type-calendar-date')
await measure(page, 'TODAY: day card label', '.mx-today-day-card__label')
await measure(page, 'TODAY: day card title (active)', '.mx-today-day-card[data-state="active"] .mx-today-day-card__title')
await measure(page, 'TODAY: day card start button', '.mx-today-day-card__start')
await measure(page, 'TODAY: pulse text', '.mx-today-pulse')
await measure(page, 'TODAY: theme card heading', '.mx-today-weekly-theme__heading')
await measure(page, 'TODAY: theme card day', '.mx-today-weekly-theme__day')
await measure(page, 'TODAY: theme card name', '.mx-today-weekly-theme__name')
await measure(page, 'TODAY: theme card question', '.mx-today-weekly-theme__question')
await measure(page, 'TODAY: theme card all link', '.mx-today-weekly-theme__all')
await measure(page, 'TODAY: pinned practice card title', '.mx-pinned-practice-card__title')
await measure(page, 'TODAY: progress label', '.mx-today-progress__label')
await measure(page, 'TODAY: progress count', '.mx-today-progress__count')

// === PRACTICES (Шаги) ===
await visitTab(page, 'practices')
await measure(page, 'STEPS: page title (практики.)', '.mx-steps-header h1')
await measure(page, 'STEPS: hero label', '.mx-steps-hero__label')
await measure(page, 'STEPS: hero title', '.mx-steps-hero__title')
await measure(page, 'STEPS: hero desc', '.mx-steps-hero__desc')
await measure(page, 'STEPS: card category', '.mx-steps-card__category')
await measure(page, 'STEPS: card title', '.mx-steps-card__title')
await measure(page, 'STEPS: card desc', '.mx-steps-card__desc')
await measure(page, 'STEPS: serif title (theme)', '.mx-steps-serif-title')
await measure(page, 'STEPS: section title', '.mx-steps-section-title')
await measure(page, 'STEPS: theme q num', '.mx-steps-theme-q__num')
await measure(page, 'STEPS: theme q text', '.mx-steps-theme-q__text')
await measure(page, 'STEPS: theme q prompt', '.mx-steps-theme-q__prompt')
await measure(page, 'STEPS: theme row title', '.mx-steps-theme-row__title')
await measure(page, 'STEPS: theme row desc', '.mx-steps-theme-row__desc')
await measure(page, 'STEPS: collection title', '.mx-steps-collection strong')
await measure(page, 'STEPS: collection desc', '.mx-steps-collection small')
await measure(page, 'STEPS: chip', '.mx-steps-chip')
await measure(page, 'STEPS: pill', '.mx-steps-pill')

// === MENTOR (Диалог) ===
await visitTab(page, 'mentor')
await measure(page, 'DIALOG: eyebrow', '.mx-dialog-eyebrow')
await measure(page, 'DIALOG: hero h1', '.mx-dialog-hero h1')
await measure(page, 'DIALOG: surface header h2', '.mx-dialog-surface__header h2')
await measure(page, 'DIALOG: card h3 (role name)', '.mx-dialog-card h3')
await measure(page, 'DIALOG: card promise', '.mx-dialog-card__promise')
await measure(page, 'DIALOG: card description', '.mx-dialog-card__description')
await measure(page, 'DIALOG: card start button', '.mx-dialog-card__start')

// === LIBRARY ===
await visitTab(page, 'library')
await measure(page, 'LIBRARY: page title', '.mx-library-catalog__header h2, .mx-library-catalog__header h3')
await measure(page, 'LIBRARY: section head h2', '.mx-library-catalog__section-head h2')
await measure(page, 'LIBRARY: eyebrow', '.mx-library-catalog__eyebrow')
await measure(page, 'LIBRARY: feature card strong', '.mx-library-catalog__feature-card strong')
await measure(page, 'LIBRARY: feature card small', '.mx-library-catalog__feature-card small')
await measure(page, 'LIBRARY: collection strong', '.mx-library-catalog__collection strong')
await measure(page, 'LIBRARY: collection small', '.mx-library-catalog__collection small')

// === TRENDS (Прогресс) ===
await visitTab(page, 'trends')
await measure(page, 'PROGRESS: history title', '.mx-progress-history__title')
await measure(page, 'PROGRESS: segment button', '.mx-progress-segment button')
await measure(page, 'PROGRESS: day label', '.mx-progress-history__day-label')
await measure(page, 'PROGRESS: row name', '.mx-progress-history__row-name')
await measure(page, 'PROGRESS: row preview', '.mx-progress-history__row-preview')
await measure(page, 'PROGRESS: period header', '.mx-progress-history__period-header')
await measure(page, 'PROGRESS: period card title', '.mx-progress-history__period-card-title')
await measure(page, 'PROGRESS: empty title', '.mx-progress-history__empty-title')
await measure(page, 'PROGRESS: empty button', '.mx-progress-history__empty-button')

// === PROFILE ===
await page.goto(`${BASE}/?demo=1&action=profile`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await measure(page, 'PROFILE: title (профиль.)', '.mx-profile-page__title')
await measure(page, 'PROFILE: group label', '.mx-profile-group__label')
await measure(page, 'PROFILE: row title', '.mx-profile-row__title')
await measure(page, 'PROFILE: row subtitle', '.mx-profile-row__subtitle')
await measure(page, 'PROFILE: row value', '.mx-profile-row__value')

// === TAB BAR ===
await visitTab(page, 'today')
await measure(page, 'TABBAR: tab label', '.mx-type-tab')

// Print results
console.log('\n=== TYPOGRAPHY MEASUREMENT (440×956, ?demo=1) ===\n')
for (const r of results) {
  if (r.found) {
    const fs = r.fontSize
    const fw = r.fontWeight
    const lh = r.lineHeight
    const ff = r.fontFamily
    console.log(`${r.label.padEnd(45)} | ${fs.padEnd(8)} | ${fw.padEnd(6)} | ${lh.padEnd(8)} | ${ff}`)
  } else {
    console.log(`${r.label.padEnd(45)} | NOT FOUND (${r.selector})`)
  }
}

await browser.close()
