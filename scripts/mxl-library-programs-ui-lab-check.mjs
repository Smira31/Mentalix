import { chromium } from 'playwright'

const baseUrl = process.env.MXL_UI_LAB_BASE_URL || 'http://127.0.0.1:4174'
const sizes = [{ width: 320, height: 568 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 430, height: 932 }]
const forbidden = /Платная программа|Demo-концепт|цена уточняется|первый день бесплатно|790 ₽|Полная программа|Получить программу|Попробовать первый день|Бесплатные статьи|Без оплаты|Бесплатные инструменты|бесплатно|fake-door|0 из 3/i
const browser = await chromium.launch({ headless: true })

async function open(page, query = '') { await page.goto(`${baseUrl}/?ui_lab=library-programs&review=1&demo=1${query}`, { waitUntil: 'networkidle' }) }
async function assertUrl(page, { screen, program, article } = {}) {
  const url = new URL(page.url())
  if (page.url().includes('[object')) throw new Error('URL contains [object Object]')
  if (url.searchParams.get('ui_lab') !== 'library-programs' || url.searchParams.get('review') !== '1') throw new Error(`unexpected UI Lab URL: ${page.url()}`)
  if (screen === 'detail' && (url.searchParams.get('screen') !== 'detail' || url.searchParams.get('program') !== program)) throw new Error(`detail URL does not identify ${program}`)
  if (screen === 'article' && (url.searchParams.get('screen') !== 'article' || url.searchParams.get('article') !== article)) throw new Error(`article URL does not identify ${article}`)
  if (!screen && [...url.searchParams.keys()].some(key => ['screen', 'program', 'article'].includes(key))) throw new Error(`landing URL retains reader state: ${page.url()}`)
}
async function assertBase(page, width) {
  await assertUrl(page)
  if (await page.locator('.mx-ui-lab__header').count()) throw new Error(`${width}: UI Lab header is visible in review mode`)
  if ((await page.locator('.mx-library-programs__bottom').count()) !== 1) throw new Error(`${width}: landing bottom navigation missing`)
  if (forbidden.test(await page.locator('.mx-library-programs__landing').innerText())) throw new Error(`${width}: forbidden copy is visible`)
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`${width}: page horizontal overflow`)
  const smallTargets = await page.evaluate(() => [...document.querySelectorAll('button')].filter(button => { const rect = button.getBoundingClientRect(); return rect.width < 44 || rect.height < 44 }).length)
  if (smallTargets) throw new Error(`${width}: ${smallTargets} tap targets below 44px`)
  const geometry = await page.locator('.mx-library-programs__featured').evaluate(element => { const rect = element.getBoundingClientRect(); const art = element.querySelector('.mx-library-programs__featured-art').getBoundingClientRect(); return { ratio: rect.width / rect.height, split: art.width / rect.width } })
  const range = width <= 360 ? [[.9, 1.1], [.95, 1.05]] : [[1.45, 1.68], [.34, .42]]
  if (geometry.ratio < range[0][0] || geometry.ratio > range[0][1] || geometry.split < range[1][0] || geometry.split > range[1][1]) throw new Error(`${width}: featured geometry ${JSON.stringify(geometry)}`)
  const small = await page.locator('.mx-library-programs__small-program').first().boundingBox()
  if (!small || small.width < geometry.split * geometry.ratio * 0 + 120 || small.height < (width <= 360 ? 220 : 200)) throw new Error(`${width}: secondary geometry is ${JSON.stringify(small)}`)
  if (await page.locator('.mx-library-programs__featured-arrow').count()) throw new Error(`${width}: featured CTA arrow remains`)
}

try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport }); await open(page); await assertBase(page, viewport.width)
    const featuredCopy = (await page.locator('.mx-library-programs__featured').innerText()).replace(/\s+/g, ' ').trim()
    if (!featuredCopy.startsWith('Самодисциплина Выстроить устойчивый ритм и доводить важное до конца без давления на себя.')) throw new Error(`${viewport.width}: featured copy is incorrect`)
    await page.locator('.mx-library-programs__featured').click(); await assertUrl(page, { screen: 'detail', program: 'Самодисциплина' })
    if (await page.getByRole('button', { name: /Открыть программу/ }).count()) throw new Error(`${viewport.width}: separate CTA exists`)
    await page.reload({ waitUntil: 'networkidle' }); await assertUrl(page, { screen: 'detail', program: 'Самодисциплина' }); await page.getByRole('button', { name: 'Назад' }).click(); await assertUrl(page)
    await page.close(); console.log(`PASS landing/detail/back ${viewport.width}x${viewport.height}`)
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); await open(page)
  await page.locator('.mx-library-programs__article').filter({ hasText: 'Как начать с одного шага' }).click(); await assertUrl(page, { screen: 'article', article: 'one-step' })
  if (!(await page.getByRole('heading', { name: 'Как начать с одного шага', exact: true }).isVisible())) throw new Error('article title missing')
  if (!(await page.getByText('1 из 3', { exact: true }).isVisible())) throw new Error('reader counter missing')
  if (await page.locator('.mx-library-programs__bottom').count()) throw new Error('bottom navigation visible in reader')
  const slide = page.locator('.mx-library-programs__reader-slide').first()
  await slide.evaluate(element => { element.scrollTop = element.scrollHeight })
  await slide.dispatchEvent('scroll')
  await page.waitForTimeout(50)
  await page.getByRole('button', { name: '← Библиотека' }).click(); await assertUrl(page)
  if ((await page.locator('.mx-library-programs__article').count()) !== 3) throw new Error('article rail missing after Back')
  await page.locator('.mx-library-programs__article').filter({ hasText: 'Как начать с одного шага' }).click(); await slide.evaluate(element => { element.scrollTop = element.scrollHeight }); await slide.dispatchEvent('scroll')
  const next = page.locator('.mx-library-programs__reader-rail')
  await next.evaluate(element => { element.scrollLeft = element.clientWidth })
  await next.dispatchEvent('scroll'); await page.waitForTimeout(80)
  await assertUrl(page, { screen: 'article', article: 'inner-support' })
  if (!(await page.getByText('2 из 3', { exact: true }).isVisible())) throw new Error('swipe counter missing')
  await next.evaluate(element => { element.scrollLeft = element.clientWidth * 2 }); await next.dispatchEvent('scroll'); await page.waitForTimeout(80); await assertUrl(page, { screen: 'article', article: 'evening-pause' })
  await page.reload({ waitUntil: 'networkidle' }); await assertUrl(page, { screen: 'article', article: 'evening-pause' })
  console.log('PASS deep-link, reload, back, three-article swipe, reader nav, read-state gate, no overflow')
  await page.close()
} finally { await browser.close() }
