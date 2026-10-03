import { webkit } from '@playwright/test'

const IPHONE = { width: 393, height: 852 }
const MIN_TAP = 43

async function measure(page, testId) {
  try {
    const result = await page.evaluate(({ testId, min }) => {
      const el = document.querySelector(`[data-testid="${testId}"]`)
      if (!el) return { testId, found: false }
      const rect = el.getBoundingClientRect()
      const scale = el.offsetWidth ? rect.width / el.offsetWidth : 1
      const half = (min / 2) * scale
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const points = [
        [-half, 0], [half, 0], [0, -half], [0, half],
        [-half * 0.98, -half * 0.98], [half * 0.98, half * 0.98],
      ]
      const misses = points.filter(([dx, dy]) => {
        const hit = document.elementFromPoint(cx + dx, cy + dy)
        return !hit || !(hit === el || el.contains(hit))
      }).length
      return {
        testId, found: true,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        misses,
        offsetW: el.offsetWidth,
        offsetH: el.offsetHeight,
      }
    }, { testId, min: MIN_TAP })
    return result
  } catch (e) {
    return { testId, found: false, error: e.message.slice(0, 100) }
  }
}

const browser = await webkit.launch()
const context = await browser.newContext({
  viewport: IPHONE,
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
})
await context.addInitScript(() => {
  localStorage.clear()
  sessionStorage.clear()
})
const page = await context.newPage()
await page.goto('http://127.0.0.1:4176/?demo=1')
await page.waitForSelector('[data-testid="today-card-morning"]', { timeout: 15000 })

const allResults = []

// Today: series-tooltip-close, pinned-practices-manage
for (const id of ['series-tooltip-close', 'pinned-practices-manage']) {
  allResults.push(await measure(page, id))
}

// Close tooltip, then check today-cards-hint-close
await page.click('[data-testid="series-tooltip-close"]')
await page.waitForSelector('[data-testid="series-tooltip-close"]', { state: 'hidden' })
allResults.push(await measure(page, 'today-cards-hint-close'))

// Open series sheet
await page.click('[data-testid="today-streak-chip"]')
await page.waitForSelector('[data-testid="series-tab-badges"]', { state: 'visible', timeout: 10000 })
for (const id of ['series-tab-badges', 'series-tab-stats', 'series-close']) {
  allResults.push(await measure(page, id))
}
await page.click('[data-testid="series-close"]')

// Check-in flow
try {
  await page.click('[data-testid="today-card-morning"]')
  await page.waitForSelector('text=Как ты сейчас?', { timeout: 10000 })
  await page.click('[data-testid="checkin-scale-option"][data-level="3"]')
  await page.click('[data-testid="checkin-next"]')
  await page.waitForSelector('text=Как ты спал?', { timeout: 10000 })
  allResults.push(await measure(page, 'checkin-next'))
} catch (e) {
  allResults.push({ testId: 'checkin-next', found: false, error: e.message.slice(0, 100) })
}

console.log('\n=== TAP AREA MEASUREMENTS (WebKit, iPhone 15 Pro) ===')
for (const r of allResults) {
  if (!r.found) {
    console.log(`${r.testId}: NOT FOUND (${r.error || ''})`)
  } else {
    const status = r.misses === 0 ? 'PASS' : `FAIL (${r.misses} misses)`
    console.log(`${r.testId}: ${r.width}x${r.height}px (offset: ${r.offsetW}x${r.offsetH}) -> ${status}`)
  }
}

await context.close()
await browser.close()
