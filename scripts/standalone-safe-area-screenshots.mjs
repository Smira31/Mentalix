import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'artifacts/standalone-safe-area'
const screens = [
  { name: 'today', tab: 'today' },
  { name: 'practices', tab: 'practices' },
]
const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
]

await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []

for (const viewport of viewports) {
  for (const screen of screens) {
    for (const mode of ['safari', 'standalone']) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      await page.goto(`${baseURL}/?demo=1&tab=${screen.tab}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      await page.locator('.mx-app-shell').evaluate(element => {
        element.classList.remove('mx-app-shell--fullscreen')
      })
      await page.addStyleTag({
        content: `
          :root { --app-safe-top: 47px; }
          .mx-preview-demo-note, .mx-demo-telegram-chrome { display: none !important; }
          .mx-app-shell--fullscreen { padding-top: 0 !important; }
          .mx-app-shell:not(.mx-dialog-app-shell) { padding-top: ${mode === 'standalone' ? '0px' : '0px'} !important; }
        `,
      })
      await page.waitForTimeout(100)
      const suffix = `${screen.name}-${viewport.name}-${mode}`
      const after = await page.locator('.mx-app-shell').evaluate(element => ({
        paddingTop: getComputedStyle(element).paddingTop,
        safeTop: getComputedStyle(document.documentElement).getPropertyValue('--app-safe-top').trim(),
      }))
      await page.screenshot({ path: `${outputDir}/after-${suffix}.png`, fullPage: false })

      if (mode === 'standalone') {
        await page.addStyleTag({
          content: '.mx-app-shell:not(.mx-dialog-app-shell):not(.mx-app-shell--fullscreen) { padding-top: 47px !important; }',
        })
        await page.waitForTimeout(100)
        const before = await page.locator('.mx-app-shell').evaluate(element => ({
          paddingTop: getComputedStyle(element).paddingTop,
        }))
        await page.screenshot({ path: `${outputDir}/before-${suffix}.png`, fullPage: false })
        results.push({ screen: screen.name, viewport: viewport.name, mode, before, after })
      } else {
        results.push({ screen: screen.name, viewport: viewport.name, mode, after })
      }
      await context.close()
    }
  }
}

await browser.close()
await fs.writeFile(`${outputDir}/metrics.json`, JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
