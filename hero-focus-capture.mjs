/**
 * Захват скриншотов шага «Путь героя» (вступление шага 1) и карточки практикума
 * на двух размерах демо-фрейма (393, 440). Скриншот — элемент демо-фрейма.
 *
 *   node /tmp/hero-focus-capture.mjs <out-dir> [label]
 *
 * Открывает dev-сервер (3000) с ?demo=1; устройство задаётся через ?device=.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'
const outDir = resolve(process.argv[2] || './hero-focus-capture')
const label = process.argv[3] || 'shot'
const DEVICES = [
  { name: '393', device: 'standard', w: 430, h: 920 },
  { name: '440', device: 'max', w: 470, h: 1020 },
]

async function shot(context, url, waitId, frameSel, file) {
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  // онбординг/демо: ждём нужный testid
  if (waitId) {
    await page.getByTestId(waitId).waitFor({ state: 'visible' })
    await page.waitForTimeout(900)
  }
  const el = await page.locator(frameSel)
  await el.waitFor({ state: 'visible' })
  await el.screenshot({ path: file })
  await page.close()
}

async function run() {
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch()
  for (const d of DEVICES) {
    const ctx = await browser.newContext({
      viewport: { width: d.w, height: d.h },
      deviceScaleFactor: 3,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    })
    // карточка в библиотеке
    await shot(
      ctx,
      `${BASE}/?demo=1&tab=library&device=${d.device}`,
      'library-hero',
      '[data-mentalix-demo-frame]',
      resolve(outDir, `${label}-card-${d.name}.png`)
    )
    // шаг 1: открыть карту -> шаг uncertainty -> вступление
    const page = await ctx.newPage()
    await page.goto(`${BASE}/?demo=1&tab=library&action=hero_journey&device=${d.device}`, {
      waitUntil: 'networkidle',
    })
    await page.getByTestId('hero-journey-map').waitFor({ state: 'visible' })
    await page.getByTestId('hero-step-uncertainty').click()
    await page.getByTestId('hero-step-start').waitFor({ state: 'visible' })
    await page.waitForTimeout(1200)
    await page
      .locator('[data-mentalix-demo-frame]')
      .screenshot({ path: resolve(outDir, `${label}-step-${d.name}.png`) })
    await page.close()
    await ctx.close()
  }
  await browser.close()
  console.log(`saved to ${outDir}`)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
