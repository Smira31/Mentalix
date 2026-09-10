import { chromium } from 'playwright'

const baseUrl = process.env.MXL_UI_LAB_BASE_URL || 'http://127.0.0.1:4174'
const sizes = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]
const browser = await chromium.launch({ headless: true })

async function open(page, query = '') {
  await page.goto(`${baseUrl}/?ui_lab=library-programs&review=1${query}`, { waitUntil: 'networkidle' })
}

try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport })
    await open(page)
    if (await page.locator('.mx-ui-lab__header').count()) throw new Error(`${viewport.width}: UI Lab header is visible in review mode`)
    if (await page.locator('.mx-library-programs__device').evaluate(element => getComputedStyle(element).borderWidth !== '0px')) throw new Error(`${viewport.width}: review device frame is visible`)
    if (!(await page.getByRole('heading', { name: 'Программы', exact: true }).isVisible())) throw new Error(`${viewport.width}: Programs heading missing`)
    if (!(await page.getByRole('button', { name: 'Посмотреть программу' }).isVisible())) throw new Error(`${viewport.width}: featured CTA missing`)
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${viewport.width}: page horizontal overflow`)
    const smallTargets = await page.evaluate(() => [...document.querySelectorAll('button')].filter(button => { const rect = button.getBoundingClientRect(); return rect.width < 44 || rect.height < 44 }).length)
    if (smallTargets) throw new Error(`${viewport.width}: ${smallTargets} tap targets below 44px`)
    await page.getByRole('button', { name: 'Посмотреть программу' }).click()
    if (!(await page.getByText('790 ₽', { exact: true }).isVisible())) throw new Error(`${viewport.width}: price missing in detail`)
    await page.close()
    console.log(`PASS landing/detail ${viewport.width}x${viewport.height}`)
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await open(page, '&screen=free-day')
  await page.getByText('День 1 из 7 · бесплатно').waitFor()
  await page.getByRole('button', { name: 'Сохранить и вернуться к программе' }).click()
  await open(page, '&screen=fake-door')
  await page.getByRole('button', { name: 'Собрать спокойный план' }).click()
  if ((await page.getByRole('button', { name: 'Собрать спокойный план' }).getAttribute('aria-pressed')) !== 'true') throw new Error('fake-door selection missing')
  await page.getByRole('button', { name: 'Отправить ответ' }).click()
  await page.getByRole('heading', { name: 'Спасибо — ответ сохранён для исследования' }).waitFor()
  await page.getByRole('button', { name: 'Вернуться в Библиотеку' }).click()
  await page.getByRole('button', { name: 'Как начать с одного шага' }).click()
  if (!(await page.getByText('Прочитано', { exact: false }).isVisible())) throw new Error('article read state missing')
  await page.close()
  console.log('PASS states 390x844')
} finally {
  await browser.close()
}
