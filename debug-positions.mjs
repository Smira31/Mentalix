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

// Open series sheet
await page.click('[data-testid="today-streak-chip"]')
await page.waitForSelector('[data-testid="series-tab-badges"]', { state: 'visible', timeout: 10000 })

const positions = await page.evaluate(() => {
  const ids = ['demo-panel-badge', 'series-close', 'series-tab-badges', 'series-tab-stats']
  return ids.map(id => {
    const el = document.querySelector(`[data-testid="${id}"]`)
    if (!el) return { id, found: false }
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return {
      id,
      found: true,
      rect: {
        left: Math.round(rect.left * 10) / 10,
        top: Math.round(rect.top * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        bottom: Math.round(rect.bottom * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      },
      zIndex: style.zIndex,
      position: style.position,
    }
  })
})

console.log(JSON.stringify(positions, null, 2))

await context.close()
await browser.close()
