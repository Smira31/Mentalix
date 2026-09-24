# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mxl-010-release-gate.spec.mjs >> MXL-010 automated technical gate >> fixture-backed journey covers check-in, completion, evening review, handoff, AI response and reopen
- Location: tests/ux/mxl-010-release-gate.spec.mjs:145:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="mentor-input"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('[data-testid="mentor-input"]') with timeout 10000ms
  - waiting for locator('[data-testid="mentor-input"]')

```

```yaml
- main:
    - region "О чём хочешь поговорить прямо сейчас?":
        - paragraph: ДИАЛОГ
        - heading "О чём хочешь поговорить прямо сейчас?" [level=1]
    - region "Выбери роль для разговора.":
        - heading "Выбери роль для разговора." [level=2]:
            - text: Выбери роль
            - strong: для разговора.
        - region "Выбор роли для разговора":
            - 'article "Наставник: Поможет увидеть новые перспективы и найти решения."':
                - heading "Наставник" [level=3]
                - paragraph: Поможет увидеть новые перспективы и найти решения.
                - paragraph: Строгий и честный. Разложит цель на шаги и не даст себя жалеть.
                - 'button "Начать разговор: Наставник"': Начать
            - 'article "Собеседник: Поможет разобраться в том, что чувствуешь."':
                - heading "Собеседник" [level=3]
                - paragraph: Поможет разобраться в том, что чувствуешь.
                - paragraph: Тёплый и внимательный разговор без оценки, когда нужно выговориться или услышать себя.
                - 'button "Начать разговор: Собеседник"': Начать
            - 'article "Следопыт: Поможет исследовать свои мысли и эмоции глубже."':
                - heading "Следопыт" [level=3]
                - paragraph: Поможет исследовать свои мысли и эмоции глубже.
                - paragraph: Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.
                - 'button "Начать разговор: Следопыт"': Начать
- navigation:
    - button "Сегодня"
    - button "Шаги"
    - button "Диалог"
    - button "Библиотека"
    - button "Прогресс"
```

# Test source

```ts
  118 |     const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } })
  119 |     const fixtures = buildFixtureRouter()
  120 |     await context.addInitScript(() => {
  121 |       localStorage.clear()
  122 |       sessionStorage.clear()
  123 |       try {
  124 |         delete window.Telegram
  125 |       } catch {
  126 |         window.Telegram = undefined
  127 |       }
  128 |     })
  129 |     await context.route('**/api/**', route => fixtures.handle(route))
  130 |     const page = await context.newPage()
  131 |
  132 |     await page.goto('/')
  133 |     await expect(
  134 |       page.getByRole('heading', { name: 'Продолжай расти даже вне приложения.' })
  135 |     ).toBeVisible()
  136 |     await expect(page.getByRole('heading', { name: 'Вход по email' })).toBeVisible()
  137 |     await expect(page.getByRole('heading', { name: 'Или через Telegram' })).toBeHidden()
  138 |     await expect(page.locator('form')).toHaveCount(1)
  139 |     await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
  140 |     await expect(page.getByRole('button', { name: 'Получить письмо' })).toBeVisible()
  141 |
  142 |     await context.close()
  143 |   })
  144 |
  145 |   test('fixture-backed journey covers check-in, completion, evening review, handoff, AI response and reopen', async ({ browser, baseURL }) => {
  146 |     const context = await browser.newContext({
  147 |       baseURL,
  148 |       viewport: { width: 390, height: 844 },
  149 |       colorScheme: 'dark',
  150 |       reducedMotion: 'reduce',
  151 |       serviceWorkers: 'block',
  152 |     })
  153 |     const fixtures = buildFixtureRouter()
  154 |     await seedUser(context)
  155 |     await context.route('**/api/**', route => fixtures.handle(route))
  156 |     const page = await context.newPage()
  157 |     // Замораживаем время на 08:00 UTC — до времени разбора (19:00) утренняя
  158 |     // карточка active, вечерняя locked (§5.1, todayCardState).
  159 |     // UTC гарантирует, что new Date().getHours() ≥ 19 после перевода clocks.
  160 |     await page.clock.setFixedTime('2026-09-23T08:00:00Z')
  161 |     await page.goto('/')
  162 |
  163 |     // ── Утренний чек-ин ──
  164 |     await openDayCard(page, 'morning')
  165 |     await expect(page.getByRole('radiogroup', { name: 'Как ты сейчас?' })).toBeVisible()
  166 |     await expect(page.getByRole('button', { name: /^(Назад|Сегодня)$/ })).toBeVisible()
  167 |     await expect(page.locator('[data-testid="checkin-next"]')).toBeVisible()
  168 |
  169 |     // Шкалы: mood=3 (Нормально), energy=3 (Средне)
  170 |     await scaleStep(page, 3)
  171 |     await scaleStep(page, 3)
  172 |
  173 |     // Текстовый шаг
  174 |     await textStep(page, 'Fixture morning note')
  175 |
  176 |     // Экран завершения
  177 |     await expect(page.getByRole('heading', { name: /Утренний чек-ин/ })).toBeVisible()
  178 |     expect(fixtures.savedCheckins).toHaveLength(0)
  179 |
  180 |     // Завершить → серия
  181 |     await completeCheckin(page)
  182 |     await expect(page.getByRole('heading', { name: /-дневная серия\./ })).toBeVisible()
  183 |     expect(fixtures.savedCheckins).toHaveLength(1)
  184 |     expect(fixtures.savedCheckins[0].note).toContain('Fixture morning note')
  185 |
  186 |     // ── Возврат и переход к вечернему разбору ──
  187 |     // После утреннего чек-ина fixture меняет review_hour на 0 (→ 19:00 в
  188 |     // resolveTodayCardStates). Переводим часы на 19:00, чтобы вечерняя
  189 |     // карточка стала active (button), а не locked (div).
  190 |     await page.clock.setFixedTime('2026-09-23T19:00:00Z')
  191 |     await backToToday(page)
  192 |     await openDayCard(page, 'evening')
  193 |
  194 |     // ── Вечерний разбор ──
  195 |     await expect(page.getByRole('heading', { name: 'Какой был день?' })).toBeVisible()
  196 |     await emotionStep(page, 'ровно')
  197 |     await page.locator('[data-testid="checkin-next"]').click()
  198 |
  199 |     // Три текстовых шага
  200 |     for (const value of ['Fixture result', 'Fixture difficulty', 'Fixture lesson']) {
  201 |       await textStep(page, value)
  202 |     }
  203 |
  204 |     // Экран завершения вечернего разбора
  205 |     await expect(page.getByRole('heading', { name: /Разбор дня/ })).toBeVisible()
  206 |     expect(fixtures.savedCheckins).toHaveLength(2)
  207 |     expect(fixtures.savedCheckins[1].review_completed).toBe(true)
  208 |
  209 |     // ── Хендофф к Следопыту ──
  210 |     const scoutBtn = page.locator('[data-testid="checkin-open-scout"]')
  211 |     await expect(scoutBtn).toBeVisible()
  212 |     await scoutBtn.click()
  213 |     await expect(page).toHaveURL(/tab=mentor/)
  214 |     await expect(page.locator('#root')).not.toHaveText('', { timeout: 30_000 })
  215 |
  216 |     // ── AI-диалог ──
  217 |     const chatInput = page.locator('[data-testid="mentor-input"]')
> 218 |     await expect(chatInput).toBeVisible()
      |                             ^ Error: expect(locator).toBeVisible() failed
  219 |     await chatInput.fill('Fixture AI question')
  220 |     await chatInput.press('Enter')
  221 |     await expect(page.getByText('Fixture AI question')).toBeVisible()
  222 |     await expect(page.getByText(LONG_AI_REPLY.slice(0, 70))).toBeVisible()
  223 |
  224 |     // Раскрыть длинный ответ
  225 |     const expandBtn = page.locator('[data-testid="ai-expand-reply"]')
  226 |     await expect(expandBtn).toBeVisible()
  227 |     await expandBtn.click()
  228 |     await expect(page.getByText('Свернуть ответ')).toBeVisible()
  229 |
  230 |     // ── Возврат на Today ──
  231 |     await goBack(page)
  232 |     await expect(page.getByRole('heading', { name: /О чём хочешь/ })).toBeVisible()
  233 |     // Первый Back закрывает conversation и оставляет fullscreen picker Mentor;
  234 |     // возврат на Today выполняется следующим шагом browser history.
  235 |     await page.goBack()
  236 |     await expect(page).toHaveURL(/\/$/)
  237 |     await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()
  238 |
  239 |     // ── Перезагрузка ──
  240 |     await page.reload()
  241 |     await expect(page).toHaveURL(/\/$/)
  242 |     await expect(page.locator('[data-testid="today-card-morning"]')).toBeVisible()
  243 |     expect(fixtures.savedCheckins.filter(item => item.review_completed === true)).toHaveLength(1)
  244 |
  245 |     // ── Календарь недели ──
  246 |     await expectWeekStrip(page)
  247 |
  248 |     await context.close()
  249 |   })
  250 | })
  251 |
```
