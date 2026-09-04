import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://127.0.0.1:5173/?ui_lab=focus-check')
await page.getByRole('heading', { name: /UI-EXP-003 · Ярусный каталог/ }).waitFor()
const previewLink = page.getByTestId('focus-check-open-preview')
if (await previewLink.getAttribute('href') !== '?ui_lab=practice-catalog') throw new Error('Preview link is not isolated UI Lab route')
await previewLink.click()
await page.getByRole('heading', { name: /Практики: production и «Ярусный каталог»/ }).waitFor()
if ((await page.url()).includes('tab=') || (await page.url()).includes('production')) throw new Error('Preview link escaped to production route')
console.log(`PASS: ${page.url()}`)
await browser.close()
