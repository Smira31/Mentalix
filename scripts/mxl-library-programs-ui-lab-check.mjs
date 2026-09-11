import { chromium } from 'playwright'

const baseUrl = process.env.MXL_UI_LAB_BASE_URL || 'http://127.0.0.1:4174'
const sizes = [{ width: 320, height: 568 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 430, height: 932 }]
const forbidden = /Платная программа|Demo-концепт|цена уточняется|первый день бесплатно|790 ₽|Полная программа|Получить программу|Попробовать первый день|Бесплатные статьи|Без оплаты|Бесплатные инструменты|бесплатно|fake-door/i
const browser = await chromium.launch({ headless: true })

async function open(page, query = '') { await page.goto(`${baseUrl}/?ui_lab=library-programs&review=1${query}`, { waitUntil: 'networkidle' }) }
async function assertUrl(page, { screen, program, article } = {}) {
  const url = new URL(page.url())
  if (url.searchParams.get('program') === '[object Object]' || page.url().includes('[object%20Object]')) throw new Error('URL contains [object Object]')
  if (url.searchParams.get('ui_lab') !== 'library-programs' || url.searchParams.get('review') !== '1') throw new Error(`unexpected UI Lab URL: ${page.url()}`)
  if (screen === 'detail' && (url.searchParams.get('screen') !== 'detail' || url.searchParams.get('program') !== program)) throw new Error(`detail URL does not identify ${program}: ${page.url()}`)
  if (screen === 'article' && (url.searchParams.get('screen') !== 'article' || url.searchParams.get('article') !== article)) throw new Error(`article URL does not identify ${article}: ${page.url()}`)
  if (!screen && (url.searchParams.has('screen') || url.searchParams.has('program') || url.searchParams.has('article'))) throw new Error(`landing URL retains detail state: ${page.url()}`)
}
async function assertBase(page, width) {
  await assertUrl(page)
  if (await page.locator('.mx-ui-lab__header').count()) throw new Error(`${width}: UI Lab header is visible in review mode`)
  if (await page.locator('.mx-library-programs__device').evaluate(element => getComputedStyle(element).borderWidth !== '0px')) throw new Error(`${width}: review device frame is visible`)
  if (!(await page.getByText('Самодисциплина', { exact: true }).isVisible())) throw new Error(`${width}: Самодисциплина is missing`)
  if (forbidden.test(await page.locator('.mx-library-programs__landing').innerText())) throw new Error(`${width}: forbidden copy is visible`)
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${width}: page horizontal overflow`)
  const smallTargets = await page.evaluate(() => [...document.querySelectorAll('button')].filter(button => { const rect = button.getBoundingClientRect(); return rect.width < 44 || rect.height < 44 }).length)
  if (smallTargets) throw new Error(`${width}: ${smallTargets} tap targets below 44px`)
  const geometry = await page.locator('.mx-library-programs__featured').evaluate(element => { const rect = element.getBoundingClientRect(); const art = element.querySelector('.mx-library-programs__featured-art').getBoundingClientRect(); return { ratio: rect.width / rect.height, split: art.width / rect.width } })
  const featuredRatioRange = width <= 360 ? [0.9, 1.1] : [1.45, 1.68]
  const featuredSplitRange = width <= 360 ? [0.95, 1.05] : [0.34, 0.42]
  if (geometry.ratio < featuredRatioRange[0] || geometry.ratio > featuredRatioRange[1]) throw new Error(`${width}: featured ratio ${geometry.ratio.toFixed(2)} outside ${featuredRatioRange.join('–')}`)
  if (geometry.split < featuredSplitRange[0] || geometry.split > featuredSplitRange[1]) throw new Error(`${width}: featured split ${geometry.split.toFixed(2)} outside ${featuredSplitRange.join('–')}`)
  const small = await page.locator('.mx-library-programs__small-program').first().boundingBox()
  const heightRange = width <= 360 ? [220, 236] : [200, 216]
  if (!small || small.width < geometry.width * 0.465 || small.width > geometry.width * 0.475 || small.height < heightRange[0] || small.height > heightRange[1]) throw new Error(`${width}: secondary geometry is ${JSON.stringify(small)}`)
}

try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport }); await open(page); await assertBase(page, viewport.width)
    const featuredCopy = (await page.locator('.mx-library-programs__featured').innerText()).replace(/\s+/g, ' ').trim()
    if (!featuredCopy.startsWith('Самодисциплина Выстроить устойчивый ритм без давления на себя.')) throw new Error(`${viewport.width}: featured copy is incorrect: ${featuredCopy}`)
    await page.locator('.mx-library-programs__featured').click(); await assertUrl(page, { screen: 'detail', program: 'Самодисциплина' })
    if (!(await page.getByRole('heading', { name: 'Самодисциплина', exact: true }).isVisible())) throw new Error(`${viewport.width}: main detail title missing`)
    if (!(await page.getByText('Скоро', { exact: true }).isVisible())) throw new Error(`${viewport.width}: main detail status missing`)
    await page.reload({ waitUntil: 'networkidle' }); await assertUrl(page, { screen: 'detail', program: 'Самодисциплина' }); await page.getByRole('button', { name: 'Назад' }).click(); await assertUrl(page)
    if (!(await page.getByRole('heading', { name: 'Программы', exact: true }).isVisible())) throw new Error(`${viewport.width}: landing missing after Back`)
    await page.close(); console.log(`PASS navigation ${viewport.width}x${viewport.height}`)
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); await open(page)
  await page.locator('.mx-library-programs__article').filter({ hasText: 'Как начать с одного шага' }).click(); await assertUrl(page, { screen: 'article', article: 'one-step' })
  if (!(await page.getByRole('heading', { name: 'Как начать с одного шага', exact: true }).isVisible())) throw new Error('article reader title missing')
  if (!(await page.getByText('1 / 3', { exact: true }).isVisible())) throw new Error('article counter missing')
  if (!(await page.getByText('1 / 3', { exact: true }).count())) throw new Error('reader state missing in deep-link')
  await page.getByRole('button', { name: 'Следующая статья' }).click(); await assertUrl(page, { screen: 'article', article: 'inner-support' })
  if (!(await page.getByRole('heading', { name: 'Как говорить с собой бережнее', exact: true }).isVisible())) throw new Error('horizontal article switch missing')
  if (!(await page.getByText('2 / 3', { exact: true }).isVisible())) throw new Error('updated article counter missing')
  await page.reload({ waitUntil: 'networkidle' }); await assertUrl(page, { screen: 'article', article: 'inner-support' }); await page.getByRole('button', { name: 'Назад' }).click(); await assertUrl(page)
  const landingCounter = await page.locator('.mx-library-programs__counter').textContent()
  if (!/1\s+из\s+3/.test(landingCounter || '')) throw new Error(`read counter missing after reload: ${landingCounter}`)
  const secondary = 'Границы без лишнего напряжения'; await page.getByRole('button', { name: secondary, exact: true }).click(); await assertUrl(page, { screen: 'detail', program: secondary })
  if (!(await page.getByRole('heading', { name: secondary, exact: true }).isVisible())) throw new Error('secondary programme detail title missing')
  await page.reload({ waitUntil: 'networkidle' }); await assertUrl(page, { screen: 'detail', program: secondary }); await page.getByRole('button', { name: 'Назад' }).click(); await assertUrl(page)
  console.log('PASS article reader, deep-link, horizontal switch, read state and secondary reload 390x844')
  await page.close()
} finally { await browser.close() }
