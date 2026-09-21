import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const page = await context.newPage()
await page.goto('http://127.0.0.1:5173/?demo=1', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Начать' }).click()
await page.getByRole('radio', { name: '4: Хорошо' }).click()
await page.waitForTimeout(350)
await page.getByRole('radio', { name: '4: Много' }).click()
await page.waitForTimeout(350)

const editor = page.locator('[contenteditable="true"]')
await editor.fill('Сегодня я заметил, что могу начать с одного спокойного шага.')
await page.setViewportSize({ width: 390, height: 520 })
await page.waitForTimeout(200)
await page.screenshot({ path: 'docs/audit/after-checkin-editor-keyboard.png', fullPage: true })

await page.setViewportSize({ width: 390, height: 844 })
await page.getByRole('button', { name: 'Далее' }).click()
await page.waitForTimeout(250)
await page.screenshot({ path: 'docs/audit/after-checkin-completion-svg.png', fullPage: true })

await page.getByRole('button', { name: 'Завершить' }).click()
await page.waitForTimeout(700)
await page.screenshot({ path: 'docs/audit/after-checkin-streak-sprout.png', fullPage: true })

await browser.close()
