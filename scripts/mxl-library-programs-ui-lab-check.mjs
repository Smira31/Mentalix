import { chromium } from 'playwright'

const baseUrl = process.env.MXL_UI_LAB_BASE_URL || 'http://127.0.0.1:4174'
const sizes = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]
const forbidden = /Платная программа|Demo-концепт|цена уточняется|первый день бесплатно|790 ₽|Полная программа|Получить программу|Попробовать первый день|fake-door/i
const browser = await chromium.launch({ headless: true })

async function open(page, query = '') {
  await page.goto(`${baseUrl}/?ui_lab=library-programs&review=1${query}`, { waitUntil: 'networkidle' })
}

async function assertBase(page, width) {
  if (await page.locator('.mx-ui-lab__header').count()) throw new Error(`${width}: UI Lab header is visible in review mode`)
  if (await page.locator('.mx-library-programs__device').evaluate(element => getComputedStyle(element).borderWidth !== '0px')) throw new Error(`${width}: review device frame is visible`)
  if (!(await page.getByText('Самодисциплина', { exact: true }).isVisible())) throw new Error(`${width}: Самодисциплина is missing`)
  if (forbidden.test(await page.locator('.mx-library-programs__landing').innerText())) throw new Error(`${width}: forbidden commercial copy is visible`)
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${width}: page horizontal overflow`)
  const smallTargets = await page.evaluate(() => [...document.querySelectorAll('button')].filter(button => { const rect = button.getBoundingClientRect(); return rect.width < 44 || rect.height < 44 }).length)
  if (smallTargets) throw new Error(`${width}: ${smallTargets} tap targets below 44px`)
}

try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport })
    await open(page)
    await assertBase(page, viewport.width)
    const featuredText = await page.locator('.mx-library-programs__featured').innerText()
    if (featuredText.trim() !== 'Самодисциплина') throw new Error(`${viewport.width}: featured card has extra copy`)
    await page.locator('.mx-library-programs__featured').click()
    if (!(await page.getByRole('heading', { name: 'Самодисциплина', exact: true }).isVisible())) throw new Error(`${viewport.width}: main detail title missing`)
    if (!(await page.getByText('Скоро', { exact: true }).isVisible())) throw new Error(`${viewport.width}: main detail status missing`)
    if (forbidden.test(await page.locator('.mx-library-programs__detail').innerText())) throw new Error(`${viewport.width}: forbidden detail copy is visible`)
    if (await page.getByRole('button', { name: /Получить|Попробовать|Отправить/ }).count()) throw new Error(`${viewport.width}: purchase/fake-door CTA is visible`)
    await page.close()
    console.log(`PASS ${viewport.width}x${viewport.height}`)
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await open(page)
  const secondary = 'Границы без лишнего напряжения'
  await page.getByRole('button', { name: secondary, exact: true }).click()
  if (!(await page.getByRole('heading', { name: secondary, exact: true }).isVisible())) throw new Error('secondary programme detail title missing')
  if (!(await page.getByText('Скоро', { exact: true }).isVisible())) throw new Error('secondary detail status missing')
  if (await page.getByRole('heading', { name: 'Самодисциплина', exact: true }).count()) throw new Error('secondary detail reused main title')
  if (forbidden.test(await page.locator('.mx-library-programs__detail').innerText())) throw new Error('secondary detail contains forbidden copy')
  await page.close()
  console.log('PASS secondary detail 390x844')
} finally {
  await browser.close()
}
