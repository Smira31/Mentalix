import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts/today-evening', { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: 'dark' })
const page = await context.newPage()
const base = 'http://127.0.0.1:5173/?demo=1'

async function shot(url, name) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('body').screenshot({ path: `artifacts/today-evening/${name}.png` })
}

await shot(`${base}&today_state=checkinPending`, 'today-before-open')
await shot(`${base}&today_state=dayClosed`, 'today-after-closed')
await shot(`${base}&today_state=reviewPending`, 'today-evening-open')

await page.goto(`${base}&today_state=reviewPending`, { waitUntil: 'networkidle' })
await page.locator('[data-kind="evening"]').click()
await page.getByRole('button', { name: 'Пропустить' }).click()
await page.getByRole('heading', { name: 'Что получилось?' }).waitFor()
await page.screenshot({ path: 'artifacts/today-evening/evening-step-1.png', fullPage: true })
await page.getByRole('button', { name: 'Дальше' }).click()
await page.getByRole('heading', { name: 'Что было трудно?' }).waitFor()
await page.screenshot({ path: 'artifacts/today-evening/evening-step-2.png', fullPage: true })
await page.getByRole('button', { name: 'Дальше' }).click()
await page.getByRole('heading', { name: 'Какой вывод забираешь?' }).waitFor()
await page.screenshot({ path: 'artifacts/today-evening/evening-step-3.png', fullPage: true })

// Skip the three optional text fields and capture the unified completion screen.
await page.getByRole('button', { name: 'Пропустить' }).click()
await page.getByText('День закрыт').waitFor()
await page.screenshot({ path: 'artifacts/today-evening/evening-completion.png', fullPage: true })

await browser.close()
console.log('evidence captured in artifacts/today-evening')
