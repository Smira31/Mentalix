# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/ux/mxl-010-release-gate.spec.mjs >> MXL-010 automated technical gate >> fixture-backed journey covers check-in, completion, evening review, handoff, AI response and reopen
- Location: tests/ux/mxl-010-release-gate.spec.mjs:165:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  81  |         sentFeedback.push(request.postDataJSON())
  82  |         return route.fulfill(jsonResponse({ ok: true }))
  83  |       }
  84  | 
  85  |       if (request.method() !== 'GET') return route.fulfill(jsonResponse({ ok: true }))
  86  | 
  87  |       if (pathname === '/api/profile') return route.fulfill(jsonResponse(TEST_USER))
  88  |       if (pathname === '/api/checkin/today') return route.fulfill(jsonResponse(checkin))
  89  |       if (pathname === '/api/checkin/history') {
  90  |         return route.fulfill(jsonResponse(checkin ? [checkin] : []))
  91  |       }
  92  |       if (pathname === '/api/rituals') {
  93  |         return route.fulfill(jsonResponse([{ id: 701, title: 'Fixture ritual', today_level: null }]))
  94  |       }
  95  |       if (pathname === '/api/ascezas') return route.fulfill(jsonResponse([]))
  96  |       if (pathname === '/api/quotes/today') {
  97  |         return route.fulfill(jsonResponse({ text: 'Fixture quote.' }))
  98  |       }
  99  |       if (pathname === '/api/profile/settings') return route.fulfill(jsonResponse({ review_hour: reviewHour }))
  100 |       if (pathname === '/api/analytics/pulse') return route.fulfill(jsonResponse({ active_today: 1 }))
  101 |       if (pathname === '/api/analytics') {
  102 |         return route.fulfill(jsonResponse({ period_days: 14, rituals: [], ascezas: [], insights: [], daily_activity: [] }))
  103 |       }
  104 |       if (pathname === '/api/pinned-practices') return route.fulfill(jsonResponse([]))
  105 |       if (pathname === '/api/articles') return route.fulfill(jsonResponse([]))
  106 |       if (pathname === '/api/themes') return route.fulfill(jsonResponse([]))
  107 |       if (pathname === '/api/mentalix/consent') return route.fulfill(jsonResponse({ context_consent: false }))
  108 |       if (pathname === '/api/mentalix/messages') {
  109 |         return route.fulfill(
  110 |           jsonResponse([{ id: 'fixture-history-1', role: 'assistant', content: 'История fixture.' }])
  111 |         )
  112 |       }
  113 | 
  114 |       return route.fulfill(jsonResponse({}))
  115 |     },
  116 |   }
  117 | }
  118 | 
  119 | async function seedUser(context) {
  120 |   await context.addInitScript(user => {
  121 |     localStorage.setItem('mentalix_web_user', JSON.stringify(user))
  122 |     localStorage.setItem('mx-onboarded-v2', '1')
  123 |     localStorage.setItem('mx-app-lock-enabled', '0')
  124 |   }, TEST_USER)
  125 | }
  126 | 
  127 | test.describe('MXL-010 automated technical gate', () => {
  128 |   test('web auth fallback after guest failure exposes email and Telegram without private data', async ({ browser, baseURL }) => {
  129 |     const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } })
  130 |     const fixtures = buildFixtureRouter()
  131 |     await context.addInitScript(() => {
  132 |       localStorage.clear()
  133 |       sessionStorage.clear()
  134 |       try {
  135 |         delete window.Telegram
  136 |       } catch {
  137 |         window.Telegram = undefined
  138 |       }
  139 |     })
  140 |     let guestRequests = 0
  141 |     await context.route('**/api/**', route => {
  142 |       if (new URL(route.request().url()).pathname === '/api/auth/guest') {
  143 |         guestRequests += 1
  144 |         return route.fulfill(jsonResponse({ error: 'unavailable' }, 503))
  145 |       }
  146 |       return fixtures.handle(route)
  147 |     })
  148 |     const page = await context.newPage()
  149 | 
  150 |     await page.goto('/')
  151 |     await expect(
  152 |       page.getByRole('heading', { name: 'Продолжай расти даже вне приложения.' })
  153 |     ).toBeVisible()
  154 |     await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  155 |     await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  156 |     await expect(page.locator('form')).toHaveCount(1)
  157 |     await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
  158 |     await expect(page.getByRole('button', { name: 'Получить письмо' })).toBeVisible()
  159 |     await expect(page.getByTestId('web-auth-guest-button')).toBeEnabled()
  160 |     expect(guestRequests).toBe(1)
  161 | 
  162 |     await context.close()
  163 |   })
  164 | 
  165 |   test('fixture-backed journey covers check-in, completion, evening review, handoff, AI response and reopen', async ({ browser, baseURL }) => {
  166 |     const context = await browser.newContext({
  167 |       baseURL,
  168 |       viewport: { width: 390, height: 844 },
  169 |       colorScheme: 'dark',
  170 |       reducedMotion: 'reduce',
  171 |       serviceWorkers: 'block',
  172 |     })
  173 |     const fixtures = buildFixtureRouter()
  174 |     await seedUser(context)
  175 |     await context.route('**/api/**', route => fixtures.handle(route))
  176 |     const page = await context.newPage()
  177 |     // Замораживаем время на 08:00 UTC — до времени разбора (19:00) утренняя
  178 |     // карточка active, вечерняя locked (§5.1, todayCardState).
  179 |     // UTC гарантирует, что new Date().getHours() ≥ 19 после перевода clocks.
  180 |     await page.clock.setFixedTime('2026-09-23T08:00:00Z')
> 181 |     await page.goto('/')
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  182 | 
  183 |     // ── Утренний чек-ин ──
  184 |     await openDayCard(page, 'morning')
  185 |     await expect(page.getByRole('radiogroup', { name: 'Как ты сейчас?' })).toBeVisible()
  186 |     await expect(page.getByRole('button', { name: /^(Назад|Сегодня)$/ })).toBeVisible()
  187 |     await expect(page.locator('[data-testid="checkin-next"]')).toBeVisible()
  188 | 
  189 |     // Шкалы: mood=3, sleep_quality=3, energy=3, focus=3
  190 |     await scaleStep(page, 3)
  191 |     await scaleStep(page, 3)
  192 |     await scaleStep(page, 3)
  193 |     await scaleStep(page, 3)
  194 | 
  195 |     // Главный фокус дня
  196 |     await dayFocusStep(page, 'Fixture day focus')
  197 | 
  198 |     // Текстовый шаг → завершение (submitTestId=checkin-complete вызывает finish)
  199 |     await textStep(page, 'Fixture morning note', 'checkin-complete')
  200 | 
  201 |     // Экран завершения
  202 |     await expect(page.getByRole('heading', { name: 'Чек-ин завершён' })).toBeVisible()
  203 |     expect(fixtures.savedCheckins).toHaveLength(1)
  204 |     expect(fixtures.savedCheckins[0].note).toContain('Fixture morning note')
  205 |     expect(fixtures.savedCheckins[0].sleep_quality).toBe(3)
  206 |     expect(fixtures.savedCheckins[0].day_focus).toBe('Fixture day focus')
  207 |     expect(fixtures.sentFeedback).toEqual([])
  208 | 
  209 |     // ── Возврат и переход к вечернему разбору ──
  210 |     // После утреннего чек-ина fixture меняет review_hour на 0 (→ 19:00 в
  211 |     // resolveTodayCardStates). Переводим часы на 19:00, чтобы вечерняя
  212 |     // карточка стала active (button), а не locked (div).
  213 |     await page.clock.setFixedTime('2026-09-23T19:00:00Z')
  214 |     await backToToday(page)
  215 |     await openDayCard(page, 'evening')
  216 | 
  217 |     // ── Вечерний разбор ──
  218 |     await expect(page.getByRole('heading', { name: 'Что ближе всего к тому, что ты чувствуешь?' })).toBeVisible()
  219 |     await emotionStep(page, 'ровно')
  220 |     await page.locator('[data-testid="checkin-next"]').click()
  221 | 
  222 |     // Три текстовых шага
  223 |     for (const value of ['Fixture result', 'Fixture difficulty', 'Fixture lesson']) {
  224 |       await textStep(page, value)
  225 |     }
  226 | 
  227 |     // Экран завершения вечернего разбора
  228 |     await expect(page.getByRole('heading', { name: /Готово\./ })).toBeVisible()
  229 |     expect(fixtures.savedCheckins).toHaveLength(2)
  230 |     expect(fixtures.savedCheckins[1].review_completed).toBe(true)
  231 | 
  232 |     // Ответ «Немного» уходит сразу: запись уже сохранена
  233 |     await feedbackStep(page, 'some')
  234 |     await expect
  235 |       .poll(() => fixtures.sentFeedback.length, { message: 'ответ разбора дошёл до бэкенда' })
  236 |       .toBe(1)
  237 |     expect(fixtures.sentFeedback[0]).toEqual({ value: 'some' })
  238 | 
  239 |     // ── Хендофф к Следопыту ──
  240 |     const scoutBtn = page.locator('[data-testid="checkin-open-scout"]')
  241 |     await expect(scoutBtn).toBeVisible()
  242 |     await scoutBtn.click()
  243 |     await expect(page).toHaveURL(/tab=mentor/)
  244 |     await expect(page.locator('#root')).not.toHaveText('', { timeout: 30_000 })
  245 | 
  246 |     // ── AI-диалог ──
  247 |     const chatInput = page.locator('[data-testid="mentor-input"]')
  248 |     await expect(chatInput).toBeVisible()
  249 |     await chatInput.fill('Fixture AI question')
  250 |     await chatInput.press('Enter')
  251 |     await expect(page.getByText('Fixture AI question')).toBeVisible()
  252 |     await expect(page.getByText(LONG_AI_REPLY.slice(0, 70))).toBeVisible()
  253 | 
  254 |     // Раскрыть длинный ответ
  255 |     const expandBtn = page.locator('[data-testid="ai-expand-reply"]')
  256 |     await expect(expandBtn).toBeVisible()
  257 |     await expandBtn.click()
  258 |     await expect(page.getByText('Свернуть ответ')).toBeVisible()
  259 | 
  260 |     // ── Возврат на Today ──
  261 |     await goBack(page)
  262 |     await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
  263 |     // Первый Back закрывает conversation и оставляет fullscreen picker Mentor;
  264 |     // возврат на Today выполняется следующим шагом browser history.
  265 |     await page.goBack()
  266 |     await expect(page).toHaveURL(/\/$/)
  267 |     await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()
  268 | 
  269 |     // ── Перезагрузка ──
  270 |     await page.reload()
  271 |     await expect(page).toHaveURL(/\/$/)
  272 |     await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()
  273 |     expect(fixtures.savedCheckins.filter(item => item.review_completed === true)).toHaveLength(1)
  274 | 
  275 |     // ── Календарь недели ──
  276 |     await expectWeekStrip(page)
  277 | 
  278 |     await context.close()
  279 |   })
  280 | })
  281 | 
```