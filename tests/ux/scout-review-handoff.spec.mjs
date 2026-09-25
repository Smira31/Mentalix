import { expect, test } from '@playwright/test'
import { emotionStep, openDayCard, textStep } from './checkin-helpers.mjs'

const user = { id: 900010, first_name: 'QA', username: 'qa' }
const day = (offset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const response = body => ({ contentType: 'application/json', body: JSON.stringify(body) })

async function setup(page, context, { hour = 19 } = {}) {
  const sent = []
  let review = { id: 7010, date: day(hour < 5 ? -1 : 0), mood: 3, energy: 3, review_completed_at: null }
  await context.addInitScript(user => {
    localStorage.setItem('mentalix_web_user', JSON.stringify(user))
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  }, user)
  await page.clock.setFixedTime(`${day()}T${String(hour).padStart(2, '0')}:00:00Z`)
  await context.route('**/api/**', route => {
    const { pathname } = new URL(route.request().url())
    const method = route.request().method()
    if (pathname === '/api/mentalix/messages' && method === 'POST') {
      sent.push(route.request().postDataJSON())
      return route.fulfill(response({ id: sent.length, role: 'assistant', content: 'Ответ Следопыта.' }))
    }
    if (pathname === '/api/checkin' && method === 'POST') {
      review = { id: 7010, date: day(hour < 5 ? -1 : 0), mood: 3, energy: 3, review_completed_at: new Date().toISOString() }
      return route.fulfill(response(review))
    }
    if (method !== 'GET') return route.fulfill(response({ ok: true }))
    const fixtures = {
      '/api/profile': user,
      '/api/checkin/today': review,
      '/api/checkin/history': review ? [review] : [],
      '/api/rituals': [],
      '/api/ascezas': [],
      '/api/quotes/today': { text: 'Цитата' },
      '/api/profile/settings': { review_hour: 0 },
      '/api/analytics/pulse': { active_today: 1 },
      '/api/pinned-practices': [],
      '/api/articles': [],
      '/api/themes': [],
      '/api/mentalix/messages': [],
    }
    return route.fulfill(response(fixtures[pathname] ?? {}))
  })
  return sent
}

for (const hour of [19, 2]) {
  test(`разбор в ${hour}:00 передаёт дату один раз`, async ({ page, context }) => {
    const sent = await setup(page, context, { hour })
    await page.goto('/')
    await openDayCard(page, 'evening')
    // Утренние показатели уже сохранены: вечер начинается с эмоции.
    await emotionStep(page, 'ровно')
    await page.locator('[data-testid="checkin-next"]').click()
    for (const value of ['Результат', 'Трудность', 'Вывод']) await textStep(page, value)
    await page.locator('[data-testid="checkin-open-scout"]').click()
    const input = page.locator('[data-testid="mentor-input"]')
    await expect(input).toBeVisible()
    await input.fill('Первый вопрос')
    await input.press('Enter')
    await expect.poll(() => sent.length).toBe(1)
    expect(sent[0].handoff).toEqual({ type: 'evening_review', date: day(hour < 5 ? -1 : 0) })
    expect(sent[0]).not.toHaveProperty('lessons')
    await input.fill('Второй вопрос')
    await input.press('Enter')
    await expect.poll(() => sent.length).toBe(2)
    expect(sent[1]).not.toHaveProperty('handoff')
  })
}

test('обычное открытие чата не передаёт handoff', async ({ page, context }) => {
  const sent = await setup(page, context)
  await page.goto('/?tab=mentor')
  await page.locator('[data-testid="mentor-persona-card"]').nth(2).click()
  await page.locator('[data-testid="mentor-start-dnevnik"]').click()
  const input = page.locator('[data-testid="mentor-input"]')
  await input.fill('Обычный вопрос')
  await input.press('Enter')
  await expect.poll(() => sent.length).toBe(1)
  expect(sent[0]).not.toHaveProperty('handoff')
})

test('чат работает при недоступном sessionStorage', async ({ page, context }) => {
  const sent = await setup(page, context)
  await page.goto('/?tab=mentor')
  await expect(page.locator('[data-testid="mentor-persona-card"]').nth(2)).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() { throw new DOMException('Storage blocked', 'SecurityError') },
    })
  })
  await page.locator('[data-testid="mentor-persona-card"]').nth(2).click()
  await page.locator('[data-testid="mentor-start-dnevnik"]').click()
  const input = page.locator('[data-testid="mentor-input"]')
  await input.fill('Вопрос без хранилища')
  await input.press('Enter')
  await expect.poll(() => sent.length).toBe(1)
  expect(sent[0]).not.toHaveProperty('handoff')
})
