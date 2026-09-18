import { chromium } from '@playwright/test'

const base = process.env.BASE_URL || 'http://127.0.0.1:5173'
const out = process.env.OUT_DIR || 'artifacts/monochrome-screens'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })

async function shot(name, url) {
  await page.goto(`${base}/${url}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
}

await shot('01-semantic-glyph', '?demo=1&tab=practices')
await shot('02-brain-trainer', '?demo=1&tab=practices&action=brain')
await shot('03-year-path', '?demo=1&tab=trends')
await shot('04-progress-ui-lab', '?ui_lab=progress-redesign')

await browser.close()
