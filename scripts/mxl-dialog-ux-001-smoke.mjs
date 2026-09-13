import { chromium } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]

const browser = await chromium.launch({ headless: true })
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
    await page.goto(`${baseURL}/?ui_lab=mentor-picker`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Диалог' }).waitFor()
    await page.getByRole('button', { name: 'Начать диалог' }).waitFor()
    await page.getByRole('button', { name: 'Выбрать другую роль' }).click()
    await page.locator('.mx-persona-redesign__role-option').filter({ hasText: 'Наставник' }).click()
    await page.getByRole('button', { name: 'Начать диалог' }).click()
    await page.getByRole('heading', { name: 'Наставник' }).waitFor()
    await page.getByRole('button', { name: 'Сменить роль' }).waitFor()
    await page.getByRole('button', { name: 'Empty' }).click()
    await page.getByText('Здесь появится ваш разговор').waitFor()
    await page.getByRole('button', { name: 'Error' }).click()
    await page.getByText('Не удалось загрузить историю').waitFor()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    if (overflow) throw new Error(`horizontal overflow at ${viewport.width}x${viewport.height}`)
    const minTapTarget = await page.evaluate(() => {
      const controls = [...document.querySelectorAll('button, input')]
      return Math.min(...controls.map(element => Math.min(element.getBoundingClientRect().width, element.getBoundingClientRect().height)))
    })
    if (minTapTarget < 44) throw new Error(`tap target ${minTapTarget}px at ${viewport.width}x${viewport.height}`)
    console.log(`PASS ${viewport.width}x${viewport.height} overflow=false minTap=${minTapTarget}px`)
    await page.close()
  }
} finally {
  await browser.close()
}
