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

async function assertUrl(page, { screen, program } = {}) {
  const url = new URL(page.url())
  if (url.searchParams.get('program') === '[object Object]' || page.url().includes('[object%20Object]')) {
    throw new Error('URL contains [object Object]')
  }
  if (url.searchParams.get('ui_lab') !== 'library-programs' || url.searchParams.get('review') !== '1') {
    throw new Error(`unexpected UI Lab URL: ${page.url()}`)
  }
  if (screen === 'detail') {
    if (url.searchParams.get('screen') !== 'detail' || url.searchParams.get('program') !== program) {
      throw new Error(`detail URL does not identify ${program}: ${page.url()}`)
    }
  } else if (url.searchParams.has('screen') || url.searchParams.has('program')) {
    throw new Error(`landing URL retains detail state: ${page.url()}`)
  }
}

async function assertBase(page, width) {
  await assertUrl(page)
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
    await assertUrl(page, { screen: 'detail', program: 'Самодисциплина' })
    if (!(await page.getByRole('heading', { name: 'Самодисциплина', exact: true }).isVisible())) throw new Error(`${viewport.width}: main detail title missing`)
    if (!(await page.getByText('Скоро', { exact: true }).isVisible())) throw new Error(`${viewport.width}: main detail status missing`)
    if (forbidden.test(await page.locator('.mx-library-programs__detail').innerText())) throw new Error(`${viewport.width}: forbidden detail copy is visible`)
    if (await page.getByRole('button', { name: /Получить|Попробовать|Отправить/ }).count()) throw new Error(`${viewport.width}: purchase/fake-door CTA is visible`)
    await page.reload({ waitUntil: 'networkidle' })
    await assertUrl(page, { screen: 'detail', program: 'Самодисциплина' })
    if (!(await page.getByRole('heading', { name: 'Самодисциплина', exact: true }).isVisible())) throw new Error(`${viewport.width}: main detail title missing after reload`)
    await page.getByRole('button', { name: 'Назад' }).click()
    await assertUrl(page)
    if (!(await page.getByRole('heading', { name: 'Программы', exact: true }).isVisible())) throw new Error(`${viewport.width}: landing missing after Back`)
    await page.close()
    console.log(`PASS navigation ${viewport.width}x${viewport.height}`)
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await open(page)
  const secondary = 'Границы без лишнего напряжения'
  await page.getByRole('button', { name: secondary, exact: true }).click()
  await assertUrl(page, { screen: 'detail', program: secondary })
  if (!(await page.getByRole('heading', { name: secondary, exact: true }).isVisible())) throw new Error('secondary programme detail title missing')
  if (!(await page.getByText('Скоро', { exact: true }).isVisible())) throw new Error('secondary detail status missing')
  if (await page.getByRole('heading', { name: 'Самодисциплина', exact: true }).count()) throw new Error('secondary detail reused main title')
  if (forbidden.test(await page.locator('.mx-library-programs__detail').innerText())) throw new Error('secondary detail contains forbidden copy')
  await page.reload({ waitUntil: 'networkidle' })
  await assertUrl(page, { screen: 'detail', program: secondary })
  if (!(await page.getByRole('heading', { name: secondary, exact: true }).isVisible())) throw new Error('secondary detail title missing after reload')
  await page.getByRole('button', { name: 'Назад' }).click()
  await assertUrl(page)
  console.log('PASS secondary navigation and reload 390x844')
  await page.close()
} finally {
  await browser.close()
}
