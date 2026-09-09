import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const baseURL =
  process.env.UI_LAB_BASE_URL || 'http://127.0.0.1:5173/?ui_lab=practice-catalog'
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
  const catalog = page.locator('.mx-layered-catalog--mxl-547-preview')
  const rail = catalog.locator('.mx-layered-catalog__rail')
  await rail.waitFor()
  const themeSection = catalog.locator('.mx-layered-catalog__theme-section')
  const themeTrack = themeSection.locator('.mx-layered-catalog__theme-track')
  const themeCards = themeTrack.locator('.mx-layered-catalog__theme')
  if (await themeCards.count() !== 4) throw new Error('Expected exactly four demo questions')
  for (const text of ['Тема недели:', 'Один вопрос.', 'Что сегодня можно сделать с меньшим усилием?', 'Заметь, где достаточно одного простого шага.', 'Начать запись']) {
    if (!(await themeSection.getByText(text, { exact: true }).count())) throw new Error(`Missing theme text: ${text}`)
  }
  const questionNumbers = await themeCards.locator('.mx-layered-catalog__theme-number').allTextContents()
  if (JSON.stringify(questionNumbers.map(text => text.trim())) !== JSON.stringify(['1', '2', '3', '4'])) throw new Error('Question numbers must be 1, 2, 3, 4')
  if (questionNumbers.some(text => /0[1-4]/.test(text))) throw new Error('Padded question number found')
  const firstTheme = await themeCards.nth(0).evaluate(element => element.getBoundingClientRect())
  const trackBox = await themeTrack.evaluate(element => element.getBoundingClientRect())
  if (Math.abs((firstTheme.left + firstTheme.right) / 2 - (trackBox.left + trackBox.right) / 2) > 2) throw new Error('First theme is not centered')
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
    await themeTrack.evaluate(element => { element.scrollLeft = element.scrollWidth })
    await page.waitForTimeout(50)
    await page.screenshot({ path: `${output}/${viewport.name}.png`, fullPage: true })
  }

  const themeState = await themeSection.evaluate(element => ({
    label: element.querySelector('.mx-layered-catalog__dots')?.getAttribute('aria-label'),
    dots: element.querySelectorAll('.mx-layered-catalog__dots i').length,
    activeDot: element.querySelector('.mx-layered-catalog__dots [data-active="true"]') !== null,
  }))
  const afterScroll = await themeTrack.evaluate(element => ({ scrollLeft: element.scrollLeft, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }))
  const activeQuestionText = await themeCards.nth(viewport.name === '390x844-scrolled' ? 3 : 0).locator('.mx-layered-catalog__theme-question').textContent()
  const cta = page.getByRole('button', { name: 'Начать запись' })
  await cta.click()
  const mappingVisible = await page.getByText(activeQuestionText, { exact: true }).isVisible()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  const soonCards = page.locator('.mx-layered-catalog__rail-card:disabled')
  const soonCount = await soonCards.count()
  const collections = page.locator('.mx-layered-catalog__collection')
  const collectionCount = await collections.count()
  const collectionTitles = await collections.allTextContents()
  results.push({ viewport: viewport.name, cardCount, soonCount, collectionCount, collectionTitles, themeState, initial, afterScroll, mappingVisible })
  await page.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
if (
  results.some(
    result =>
      result.cardCount !== 3 ||
      result.soonCount !== 2 ||
      result.themeState.dots !== 4 ||
      !result.themeState.activeDot ||
      result.collectionCount !== 4 ||
      !result.collectionTitles.some(title => title.includes('Психологические практики')) ||
      result.collectionTitles.some(title => title.includes('Лила')) ||
      !result.mappingVisible ||
      (result.viewport === '390x844-scrolled' && result.afterScroll.scrollLeft <= 0) ||
      result.initial.cards[2].right <= result.initial.railRight
  )
) {
  process.exit(1)
}
