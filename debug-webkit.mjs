import { webkit } from '@playwright/test'

const browser = await webkit.launch()
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  isMobile: true, hasTouch: true,
  colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block',
})
await context.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
const page = await context.newPage()
await page.goto('http://127.0.0.1:4176/?demo=1')
await page.waitForSelector('[data-testid="today-card-morning"]', { timeout: 15000 })

async function debugTap(page, testId) {
  return await page.evaluate(({ testId }) => {
    const el = document.querySelector(`[data-testid="${testId}"]`)
    if (!el) return { testId, found: false }
    const rect = el.getBoundingClientRect()
    const scale = el.offsetWidth ? rect.width / el.offsetWidth : 1
    const half = (43 / 2) * scale
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const points = [
      [-half, 0], [half, 0], [0, -half], [0, half],
      [-half * 0.98, -half * 0.98], [half * 0.98, half * 0.98],
    ]
    const details = points.map(([dx, dy]) => {
      const hit = document.elementFromPoint(cx + dx, cy + dy)
      const isHit = hit && (hit === el || el.contains(hit))
      return {
        pt: [Math.round(dx*100)/100, Math.round(dy*100)/100],
        hit: isHit,
        hitTag: hit?.tagName,
        hitClass: hit?.className?.toString?.()?.slice(0, 60),
        hitTestid: hit?.getAttribute?.('data-testid'),
      }
    })
    return {
      testId, found: true,
      size: [Math.round(rect.width*100)/100, Math.round(rect.height*100)/100],
      borderRadius: getComputedStyle(el).borderRadius,
      details,
    }
  }, { testId })
}

// 1. series-tooltip-close
const r1 = await debugTap(page, 'series-tooltip-close')
console.log('\n--- series-tooltip-close ---')
console.log(JSON.stringify(r1, null, 2))

// Close tooltip, open series sheet
await page.click('[data-testid="series-tooltip-close"]')
await page.waitForSelector('[data-testid="series-tooltip-close"]', { state: 'hidden' })
await page.click('[data-testid="today-streak-chip"]')
await page.waitForSelector('[data-testid="series-tab-badges"]', { state: 'visible', timeout: 10000 })

// 2. series-tab-stats
const r2 = await debugTap(page, 'series-tab-stats')
console.log('\n--- series-tab-stats ---')
console.log(JSON.stringify(r2, null, 2))

// 3. series-close
const r3 = await debugTap(page, 'series-close')
console.log('\n--- series-close ---')
console.log(JSON.stringify(r3, null, 2))

await context.close()
await browser.close()
