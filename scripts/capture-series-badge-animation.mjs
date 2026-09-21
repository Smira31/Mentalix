import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseURL = process.env.MENTALIX_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = '/tmp/mentalix-series-animation'
const viewports = [
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
]
const offsets = [0, 40, 80, 120, 180, 240, 320, 420]

await fs.rm(outputDir, { recursive: true, force: true })
await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium' })

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: 'dark' })
  const page = await context.newPage()
  await page.goto(`${baseURL}/?demo=1&tab=today`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Мой путь/ }).click()
  await page.locator('.mx-path-surface').waitFor({ state: 'visible' })
  for (const offset of offsets) {
    if (offset > 0) await page.waitForTimeout(offsets[offsets.indexOf(offset) - 1] ? offset - offsets[offsets.indexOf(offset) - 1] : offset)
    await page.screenshot({ path: `${outputDir}/${viewport.name}-${String(offset).padStart(3, '0')}ms.png` })
  }
  await page.screenshot({ path: `${outputDir}/${viewport.name}-final.png`, fullPage: true })
  await context.close()
}
await browser.close()
console.log(outputDir)
