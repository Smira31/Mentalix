import { webkit, devices } from 'playwright'
import { readFileSync } from 'node:fs'
const src = readFileSync('tests/ux/telegram-react-update-depth.spec.mjs','utf8')
const mockFn = new Function('return ' + src.slice(src.indexOf('function installTelegramMock'), src.indexOf('async function mockApi')))()
const DELAY = Number(process.env.DELAY||5000)
const base = process.env.BASE
const b = await webkit.launch()
async function run(label, warm) {
  const ctx = await b.newContext({ ...devices['iPhone 15 Pro'], colorScheme:'dark', serviceWorkers:'block' })
  if (warm) await ctx.addStorageState?.(warm)
  const pg = await ctx.newPage()
  await mockFn(pg)
  const t0 = Date.now(); const reqs = []
  await pg.route('**/api/**', async route => {
    const p = new URL(route.request().url()).pathname; reqs.push(`${Date.now()-t0} ${p}`)
    await new Promise(r=>setTimeout(r, DELAY))
    const m = {'/api/streak': {current_streak: 4, longest_streak: 9, total_active_days: 20, is_active_today: true}, '/api/profile/settings': {review_hour: 21}, '/api/checkin/today': null, '/api/analytics/pulse': {active_today: 2}, '/api/profile': {id:900001, first_name:'Loop'}}
    route.fulfill({status:200, contentType:'application/json', body: JSON.stringify(p in m ? m[p] : [])})
  })
  const marks = {}
  const poll = setInterval(async () => {
    try {
      const s = await pg.evaluate(() => ({
        loading: document.body.innerText.includes('Загрузка'),
        header: !!document.querySelector('[data-testid="today-streak-chip"]'),
        streakNum: document.querySelector('[data-testid="today-streak-chip"] strong')?.textContent || null,
        card: document.body.innerText.includes('Мысль дня'),
      }))
      const t = Date.now()-t0
      for (const [k,v] of Object.entries(s)) if (v && marks[k]==null) marks[k]=t
    } catch {}
  }, 50)
  await pg.goto(base)
  await pg.getByText('Мысль дня').first().waitFor({timeout: 60000})
  await new Promise(r=>setTimeout(r, DELAY+500))
  clearInterval(poll)
  console.log(label, JSON.stringify(marks))
  const state = await ctx.storageState()
  await pg.close(); await ctx.close()
  return state
}
await run('cold', null)
// second launch in same "device": reuse localStorage
const ctx2state = null
await b.close()
