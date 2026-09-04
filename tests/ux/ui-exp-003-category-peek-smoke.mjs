import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://127.0.0.1:5173/?ui_lab=practice-catalog')
await page.getByRole('heading', { name: 'Коллекции' }).waitFor()

const themeTrack = page.locator('.mx-layered-catalog__theme-track')
const theme = page.locator('.mx-layered-catalog__theme').first()
const themeCard = page.locator('.mx-layered-catalog__theme-copy').first()
const trackMetrics = await themeTrack.evaluate(el => ({
  scrollSnapType: getComputedStyle(el).scrollSnapType,
}))
const slideBox = await theme.boundingBox()
const cardBox = await themeCard.boundingBox()
const themeWidthRatio = cardBox.width / slideBox.width
if (!cardBox || themeWidthRatio < 0.6 || themeWidthRatio > 0.78) {
  throw new Error(`Theme card width ratio out of range: ${themeWidthRatio}`)
}
if (!trackMetrics.scrollSnapType.includes('mandatory')) throw new Error('Theme track is missing scroll-snap')
const themeSlideCount = await page.locator('.mx-layered-catalog__theme').count()
if (themeSlideCount !== 7) throw new Error(`Expected 7 weekly-theme questions, got ${themeSlideCount}`)

// Tap the card to open the journal entry screen (Screen 2).
await theme.click()
await page.locator('.mx-layered-catalog__entry').waitFor()
if (await page.locator('.mx-layered-catalog__entry-question').count() !== 1) {
  throw new Error('Journal entry question missing')
}
await page.locator('.mx-layered-catalog__entry-textarea').fill('Пробная запись для smoke-теста.')

// Close (submit) the entry to reach the completion screen (Screen 3).
await page.locator('.mx-layered-catalog__entry-close').click()
await page.locator('.mx-layered-catalog__complete').waitFor()
const moodButtons = page.locator('.mx-layered-catalog__mood')
if (await moodButtons.count() !== 3) throw new Error('Expected 3 mood rating buttons')
await moodButtons.nth(2).click()
if ((await moodButtons.nth(2).getAttribute('aria-pressed')) !== 'true') {
  throw new Error('Mood button did not toggle aria-pressed')
}

// Save & finish returns to the catalog screen.
await page.locator('.mx-layered-catalog__complete-save').click()
await page.locator('#theme-title').waitFor()

await page.locator('.mx-layered-catalog__collection').first().click()
await page.getByRole('heading', { name: 'На одну минуту' }).waitFor()
if (await page.locator('.mx-layered-category__recommended').count() !== 1) throw new Error('Recommended practice block missing')
if (await page.locator('.mx-layered-category__grid').count() !== 2) throw new Error('Category sections missing')
if (await page.locator('.mx-layered-category__premium').count() < 1) throw new Error('Premium marker missing')
if (await page.locator('.mx-layered-category__lock').count() < 1) throw new Error('Premium lock missing')
await page.getByRole('button', { name: 'Назад к коллекциям' }).click()
await page.getByRole('heading', { name: 'Коллекции' }).waitFor()

console.log(
  `PASS: theme card ratio ${themeWidthRatio.toFixed(2)}, 7 questions, entry->complete->catalog flow, category navigation ok`
)
await browser.close()
