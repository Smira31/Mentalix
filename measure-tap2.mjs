import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
})
await context.addInitScript(() => {
  localStorage.clear()
  sessionStorage.clear()
})
const page = await context.newPage()
await page.goto('http://127.0.0.1:4173/?demo=1')
await page.waitForSelector('[data-testid="today-card-morning"]', { timeout: 15000 })

const debug = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="pinned-practices-manage"]')
  if (!el) return { found: false }
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const half = 43 / 2 // 21.5
  const points = [
    [-half, 0], [half, 0], [0, -half], [0, half],
    [-half * 0.98, -half * 0.98], [half * 0.98, half * 0.98],
  ]
  const results = points.map(([dx, dy]) => {
    const hit = document.elementFromPoint(cx + dx, cy + dy)
    return {
      point: [Math.round(dx*100)/100, Math.round(dy*100)/100],
      hit: hit ? {
        tag: hit.tagName,
        id: hit.id || '',
        className: hit.className?.toString?.() || '',
        testid: hit.getAttribute('data-testid') || '',
        isSame: hit === el,
        isChild: el.contains(hit),
      } : null,
    }
  })
  // Also check center
  const centerHit = document.elementFromPoint(cx, cy)
  return {
    rect: { width: rect.width, height: rect.height, left: rect.left, top: rect.top },
    center: centerHit ? {
      tag: centerHit.tagName,
      className: centerHit.className?.toString?.() || '',
      testid: centerHit.getAttribute('data-testid') || '',
      isSame: centerHit === el,
    } : null,
    points: results,
  }
})

console.log(JSON.stringify(debug, null, 2))

await context.close()
await browser.close()
