import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const base = 'http://127.0.0.1:5173/?demo=1'

async function capture(state, name) {
  await page.goto(`${base}&today_state=${state}`, { waitUntil: 'networkidle' })
  await page.getByText(state === 'checkinPending' ? 'Пройти чек-ин' : 'Чек-ин пройден.').waitFor()
  await page.screenshot({ path: `artifacts/today-checkin-${name}.png`, fullPage: true })
}

await capture('checkinPending', 'before')
await capture('dayInProgress', 'after')
await page.locator('[data-complete="true"]').click()
await page.getByText('Сегодняшний check-in').waitFor()
await page.screenshot({ path: 'artifacts/today-checkin-recap.png', fullPage: true })
await browser.close()
