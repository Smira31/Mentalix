import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const mode = process.argv[2] || 'before'
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const viewports = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
]
const steps = [
  { name: 'intro', advance: 0 },
  { name: 'age', advance: 2 },
  { name: 'reminder', advance: 3 },
]

await fs.mkdir(`artifacts/onboarding/${mode}`, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
for (const viewport of viewports) {
  for (const step of steps) {
    const page = await browser.newPage({ viewport })
    await page.goto(`${baseURL}/?onboarding_preview=1`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(250)
    for (let i = 0; i < step.advance; i += 1) {
      if (i === 0) await page.getByRole('button', { name: 'Начать' }).click()
      else if (i === 1) {
        await page.getByRole('button', { name: 'Меньше тревоги' }).click()
        await page.getByRole('button', { name: 'Дальше' }).click()
      } else if (i === 2) {
        await page.getByRole('button', { name: 'До 18' }).click()
        await page.getByRole('button', { name: 'Дальше' }).click()
      }
      await page.waitForTimeout(120)
    }
    const metrics = await page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight },
      body: { scrollHeight: document.body.scrollHeight, clientHeight: document.body.clientHeight },
      surface: (() => {
        const el = document.querySelector('.fixed.top-0')
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, height: r.height, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
      })(),
      scrollArea: (() => {
        const el = document.querySelector('.overflow-y-auto')
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, height: r.height, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, overflow: getComputedStyle(el).overflowY }
      })(),
      content: (() => {
        const el = document.querySelector('.mx-onboarding-step')
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, height: r.height }
      })(),
      reminderCards: [...document.querySelectorAll('.mx-onboarding-reminder')].map(el => {
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return { top: r.top, bottom: r.bottom, height: r.height, paddingTop: s.paddingTop, paddingBottom: s.paddingBottom }
      }),
    }))
    await page.screenshot({ path: `artifacts/onboarding/${mode}/${viewport.name}-${step.name}.png`, fullPage: false })
    results.push({ viewport: viewport.name, step: step.name, metrics })
    await page.close()
  }
}
await fs.writeFile(`artifacts/onboarding/${mode}/metrics.json`, JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
await browser.close()
