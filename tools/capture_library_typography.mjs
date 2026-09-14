import { chromium } from 'playwright'
import fs from 'node:fs'

const base = 'https://4173-i516v9ybffe3o1aaa2bu7-d8970343.us1.manus.computer'
const out = '/home/ubuntu/Mentalix/artifacts'
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })

async function capture(name, query, bannerSelector, titleSelector) {
  const page = await context.newPage()
  await page.goto(`${base}/?demo=1&${query}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const banner = page.locator(bannerSelector)
  await banner.scrollIntoViewIfNeeded()
  await banner.screenshot({ path: `${out}/${name}.png` })
  const audit = await page.evaluate(({ titleSelector, bannerSelector }) => {
    const title = document.querySelector(titleSelector)
    const banner = document.querySelector(bannerSelector)
    const matched = []
    function walkRules(sheet, inherited = '') {
      let rules
      try { rules = sheet.cssRules } catch { return }
      for (const rule of rules || []) {
        if (rule.cssRules) { walkRules(rule, inherited); continue }
        if (!rule.selectorText || !title) continue
        let matches = false
        try { matches = title.matches(rule.selectorText) } catch {}
        if (matches) matched.push({ selector: rule.selectorText, cssText: rule.cssText, href: sheet.href })
      }
    }
    for (const sheet of document.styleSheets) walkRules(sheet)
    const cs = getComputedStyle(title)
    return {
      url: location.href,
      title: { tag: title?.tagName, className: title?.className, text: title?.textContent, rect: title?.getBoundingClientRect().toJSON(), computed: Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','margin','maxWidth'].map(k => [k, cs[k]])) },
      banner: banner?.getBoundingClientRect().toJSON(), matched
    }
  }, { titleSelector, bannerSelector })
  await page.close()
  return audit
}

const journal = await capture('01-reference-journal-390', 'tab=practices&library_v2=1', '.mx-layered-catalog__journal-hero', '.mx-layered-catalog__journal-hero-copy h2')
const ours = await capture('02-our-program-390-before-fix', 'tab=library&library_v2=1', 'section[aria-labelledby="library-v2-programs-title"] .mx-library-v2__featured-banner', 'section[aria-labelledby="library-v2-programs-title"] .mx-library-v2__featured-copy h3')
fs.writeFileSync(`${out}/css-cascade-before.json`, JSON.stringify({ journal, ours }, null, 2))
console.log(JSON.stringify({ journal, ours }, null, 2))
await browser.close()
