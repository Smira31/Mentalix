import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const baseURL = 'http://127.0.0.1:5173/?ui_lab=practice-catalog'
const output = 'artifacts/mxl-547-ui-lab'
const viewports = [
  { name: '390x844-initial', width: 390, height: 844 },
  { name: '390x844-scrolled', width: 390, height: 844 },
  { name: '375x812', width: 375, height: 812 },
  { name: '320x568', width: 320, height: 568 },
]

await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  const rail = page.locator('.mx-layered-catalog__rail')
  await rail.waitFor()
  const cardCount = await rail.locator('.mx-layered-catalog__rail-card').count()
  const initial = await rail.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    railRight: element.getBoundingClientRect().right,
    cards: [...element.querySelectorAll('.mx-layered-catalog__rail-card')].map(card => ({
      title: card.querySelector('strong')?.textContent,
      disabled: card.disabled,
      right: card.getBoundingClientRect().right,
    })),
  }))
  await page.screenshot({ path: `${output}/${viewport.name}.png`, fullPage: true })

  if (viewport.name === '390x844-scrolled') {
    await rail.evaluate(element => { element.scrollLeft = element.scrollWidth })
    await page.waitForTimeout(50)
    await page.screenshot({ path: `${output}/${viewport.name}.png`, fullPage: true })
  }

  const afterScroll = await rail.evaluate(element => ({ scrollLeft: element.scrollLeft, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }))
  const lila = page.getByRole('button', { name: 'Открыть Разобраться через Лилу' })
  await lila.click()
  const mappingVisible = await page.getByText(/practiceKey=lila-discover/).isVisible()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  const soonCards = page.locator('.mx-layered-catalog__rail-card:disabled')
  const soonCount = await soonCards.count()
  results.push({ viewport: viewport.name, cardCount, soonCount, initial, afterScroll, mappingVisible })
  await page.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
if (
  results.some(
    result =>
      result.cardCount !== 3 ||
      result.soonCount !== 2 ||
      !result.mappingVisible ||
      (result.viewport === '390x844-scrolled' && result.afterScroll.scrollLeft <= 0) ||
      result.initial.cards[2].right <= result.initial.railRight
  )
) {
  process.exit(1)
}
