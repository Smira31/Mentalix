import { expect, test } from '@playwright/test'

const BASE = process.env.DAIMON_FLOW_URL || 'http://127.0.0.1:5173/?demo=1&tab=practices&sub=daimon'
const stateKey = mode => `mentalix_preview_demo_state_v6:daimon:${mode}`

async function openMode(page, mode, extra = '') {
  await page.goto(`${BASE}&frame=0&daimonTest=${mode}${extra}`, { waitUntil: 'networkidle' })
  await expect(page.getByTestId('daimon-board')).toBeVisible()
}

async function answerCell(page) {
  await expect(page.getByTestId('daimon-chat-input')).toBeVisible()
  await expect(page.getByTestId('daimon-thinking')).toBeHidden()
  for (let i = 0; i < 2; i++) {
    await page.getByTestId('daimon-chat-input').fill(`Наблюдение ${i + 1}`)
    await page.getByTestId('daimon-chat-send').click()
    await expect(page.getByTestId('daimon-thinking')).toBeHidden()
  }
  await expect(page.getByTestId('daimon-insight')).toBeVisible()
}

async function storedGame(page, mode) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)).daimon.game, stateKey(mode))
}

// Экран перехода держится 2,2 с и закрывается тапом, поэтому его видно обычным
// expect. Геометрию снимаем одним замером: подпись, откуда, стрелка и куда идут
// сверху вниз одной колонкой.
async function readTransition(page, kind) {
  const root = page.getByTestId('daimon-transition')
  await expect(root).toBeVisible()
  await expect(root).toHaveAttribute('data-kind', kind)
  await expect(page.getByTestId('daimon-transition-sub')).toHaveText('Нажми, чтобы продолжить')
  return root.evaluate(el => {
    const text = testId => el.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim()
    const path = el.querySelector('.mx-daimon-transition__path')
    const rectOf = node => (node ? node.getBoundingClientRect() : null)
    const labelRect = rectOf(el.querySelector('[data-testid="daimon-transition-label"]'))
    const fromRect = rectOf(el.querySelector('[data-testid="daimon-transition-from"]'))
    const arrowRect = rectOf(el.querySelector('.mx-daimon-transition__arrow'))
    const toRect = rectOf(el.querySelector('[data-testid="daimon-transition-to"]'))
    const stacked =
      Boolean(labelRect && fromRect && arrowRect && toRect) &&
      labelRect.bottom <= fromRect.top + 1 &&
      fromRect.bottom <= arrowRect.top + 1 &&
      arrowRect.bottom <= toRect.top + 1
    return {
      label: text('daimon-transition-label'),
      from: text('daimon-transition-from'),
      to: text('daimon-transition-to'),
      flexDirection: path ? getComputedStyle(path).flexDirection : null,
      stacked,
    }
  })
}

test('прямая ссылка работает и после изменения URL без перезагрузки', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/?demo=1&frame=0', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    history.pushState({}, '', '/?demo=1&frame=0&tab=practices&sub=daimon')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByTestId('daimon-start')).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('daimon-start')).toBeVisible()
})

test('chatError: повтор первого вопроса и сохранение введённого ответа при сбое', async ({
  page,
}) => {
  await openMode(page, 'chatError')
  await expect(page.getByTestId('daimon-continue-cell')).toContainText('Продолжить клетку 3 ·')
  await page.getByTestId('daimon-continue-cell').click()
  await expect(page.getByTestId('daimon-chat-error')).toContainText(
    'Даймон не ответил. Попробуй ещё раз'
  )
  await expect(page.getByTestId('daimon-thinking')).toBeHidden()
  await page.getByTestId('daimon-chat-retry').click()
  await expect(page.getByTestId('daimon-chat-error')).toBeHidden()
  await expect(page.getByTestId('daimon-chat')).toContainText('Как это связано')
  await page.evaluate(() => sessionStorage.setItem('mentalix:demo-network:v1', 'Ошибка сервера'))
  await page.getByTestId('daimon-chat-input').fill('Мой ответ не потеряется')
  await page.getByTestId('daimon-chat-send').click()
  await expect(page.getByTestId('daimon-chat-error')).toBeVisible()
  await expect(page.getByTestId('daimon-chat-input')).toHaveValue('Мой ответ не потеряется')
  await page.evaluate(() => sessionStorage.removeItem('mentalix:demo-network:v1'))
  await page.getByTestId('daimon-chat-retry').click()
  await expect(page.getByTestId('daimon-chat-error')).toBeHidden()
  await expect(page.getByTestId('daimon-chat')).toContainText('Мой ответ не потеряется')
  expect((await storedGame(page, 'chatError')).chat_asked_count).toBe(2)
})

test('crisis: ответ и помощь без вывода, pending-клетка остаётся открытой', async ({ page }) => {
  await openMode(page, 'crisis')
  await page.getByTestId('daimon-continue-cell').click()
  await expect(page.getByTestId('daimon-chat')).toContainText('Слышу тебя')
  await expect(page.getByTestId('daimon-crisis')).toContainText('напиши близкому человеку')
  await expect(page.getByTestId('daimon-insight')).toBeHidden()
  await page.getByTestId('daimon-crisis-back').click()
  await expect(page.getByTestId('daimon-continue-cell')).toBeVisible()
  expect((await storedGame(page, 'crisis')).pending_move_id).toBeTruthy()
  await page.reload()
  await expect(page.getByTestId('daimon-continue-cell')).toBeVisible()
})

test('nearFinish: 36 → финал → «Взгляд сверху» → «Твой путь»', async ({ page }) => {
  await openMode(page, 'nearFinish')
  await page.getByTestId('daimon-roll').click()
  await answerCell(page)
  await page.getByTestId('daimon-skip').click()
  await expect(page.getByTestId('daimon-finish')).toBeVisible()
  expect((await storedGame(page, 'nearFinish')).status).toBe('finished')

  // Итог Даймона падает — «Взгляд сверху» показывает ошибку и повтор.
  await page.evaluate(() => sessionStorage.setItem('mentalix:demo-network:v1', 'Ошибка сервера'))
  await page.getByTestId('daimon-overview-open').click()
  await expect(page.getByTestId('daimon-overview')).toBeVisible()
  await expect(page.getByTestId('daimon-summary-error')).toBeVisible()
  await page.evaluate(() => sessionStorage.removeItem('mentalix:demo-network:v1'))
  await page.getByTestId('daimon-summary-retry').click()
  await expect(page.getByTestId('daimon-summary')).toBeVisible()

  // «Взгляд сверху» показывает запрос и «Твой путь» с пройденной клеткой.
  await expect(page.getByTestId('daimon-overview')).toContainText('Твой запрос')
  await expect(page.getByTestId('daimon-overview')).toContainText('Твой путь')
  await expect(page.getByTestId('daimon-path')).toContainText('Даймон')

  // Завершённая игра из «Моих игр» открывается тем же «Взглядом сверху».
  await page.getByTestId('daimon-overview-games').click()
  await expect(page.getByTestId('daimon-games-list')).toContainText('Завершена')
  await page.getByTestId('daimon-game-daimon-test-nearFinish').click()
  await expect(page.getByTestId('daimon-overview')).toBeVisible()
  await expect(page.getByTestId('daimon-path')).toContainText('Даймон')

  // Игра завершена — новая начинается без подтверждения.
  await page.getByTestId('daimon-overview-new-game').click()
  await expect(page.getByTestId('daimon-new-game-confirm')).toBeHidden()
  await expect(page.getByTestId('daimon-start')).toBeVisible()
})

test('bounce: 34 + 4 → экран отскока «Даймон ↓ Тишина», затем клетка, не финал', async ({
  page,
}) => {
  await openMode(page, 'bounce')
  await page.getByTestId('daimon-roll').click()
  const snap = await readTransition(page, 'bounce')
  expect(snap).toMatchObject({
    label: 'Отскок',
    from: 'Даймон',
    to: 'Тишина',
  })
  expect((await storedGame(page, 'bounce')).position).toBe(34)
  // Экран закроется сам через 2,2 с — после него клетка приземления.
  await expect(page.getByTestId('daimon-cell-title')).toHaveText('Тишина')
  await expect(page.getByTestId('daimon-finish')).toBeHidden()
})

test('nearSnake: 10 + 1 → 11, экран перехода «Змея» столбиком, тап закрывает', async ({
  page,
}) => {
  await openMode(page, 'nearSnake')
  await page.getByTestId('daimon-roll').click()
  await answerCell(page)
  await page.getByTestId('daimon-skip').click()
  const snap = await readTransition(page, 'snake')
  expect(snap.label).toBe('Змея')
  expect(snap.from).toBe('Самообман')
  expect(snap.to).toBe('Автопилот')
  expect(snap.flexDirection).toBe('column')
  expect(snap.stacked).toBe(true)

  // Тап в любом месте закрывает переход раньше срока — сразу поле клетки 2.
  await page.getByTestId('daimon-transition').click()
  await expect(page.getByTestId('daimon-transition')).toBeHidden()
  await expect(page.getByTestId('daimon-position')).toContainText('Ты здесь: 2 ·')
  expect((await storedGame(page, 'nearSnake')).position).toBe(2)
})

test('возврат в клетку показывает первую реплику и ответ игрока', async ({ page }) => {
  await openMode(page, 'nearSnake')
  await page.getByTestId('daimon-roll').click()
  await expect(page.getByTestId('daimon-chat-msg-assistant').first()).toContainText('Самообман')
  await page.getByTestId('daimon-chat-input').fill('Мой ответ игрока')
  await page.getByTestId('daimon-chat-send').click()
  await expect(page.getByTestId('daimon-chat-msg-user').first()).toContainText('Мой ответ игрока')
  await expect(page.getByTestId('daimon-thinking')).toBeHidden()

  // Уходим на поле и возвращаемся в ту же клетку — разговор восстанавливается.
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('daimon-continue-cell')).toContainText('Продолжить клетку 11')
  await page.getByTestId('daimon-continue-cell').click()
  await expect(page.getByTestId('daimon-chat-msg-assistant').first()).toContainText('Самообман')
  await expect(page.getByTestId('daimon-chat-msg-user').first()).toContainText('Мой ответ игрока')
  await expect(page.getByTestId('daimon-thinking')).toBeHidden()
})

test('slow: загрузка, блокировка отправки и один бросок при двойном тапе', async ({ page }) => {
  await openMode(page, 'slow')
  await page.getByTestId('daimon-roll').dblclick()
  await expect(page.getByTestId('daimon-roll')).toBeDisabled()
  await expect(page.getByTestId('daimon-roll-spinner')).toBeVisible()
  await expect(page.getByTestId('daimon-chat-input')).toBeVisible()
  await expect(page.getByTestId('daimon-thinking')).toBeHidden()
  expect((await storedGame(page, 'slow')).throws_today).toBe(1)
  await page.getByTestId('daimon-chat-input').fill('Ответ на медленном сервере')
  await page.getByTestId('daimon-chat-send').dblclick()
  await expect(page.getByTestId('daimon-chat-send')).toBeDisabled()
  await expect(page.getByTestId('daimon-thinking')).toBeVisible()
  await expect(page.getByTestId('daimon-thinking')).toBeHidden()
  expect((await storedGame(page, 'slow')).chat_asked_count).toBe(2)
})

test('новая активная игра требует подтверждения; отмена сохраняет поле', async ({ page }) => {
  await openMode(page, 'nearSnake')
  await page.getByTestId('daimon-board-new-game').click()
  await expect(page.getByTestId('daimon-new-game-confirm')).toContainText(
    'Текущая игра закончится. Начать новую?'
  )
  await page.getByTestId('daimon-new-game-cancel').click()
  await expect(page.getByTestId('daimon-position')).toContainText('Ты здесь: 10 ·')
  await page.getByTestId('daimon-board-new-game').click()
  await page.getByTestId('daimon-new-game-confirm-yes').click()
  await expect(page.getByTestId('daimon-start')).toBeVisible()
})

test('гостевой отказ ведёт в тот же email-вход, что Профиль', async ({ page }) => {
  await openMode(page, 'chatError', '&guest=1')
  await page.getByTestId('daimon-continue-cell').click()
  await expect(page.getByTestId('daimon-guest-gate')).toContainText(
    'Чтобы говорить с Даймоном, сохрани прогресс'
  )
  await page.getByTestId('daimon-guest-gate-button').click()
  await expect(page.getByTestId('daimon-guest-gate')).toBeHidden()
  await expect(page.getByRole('textbox', { name: /email|почт/i })).toBeVisible()
})

test('лимиты запроса и вывода: счётчик и блокировка ✓', async ({ page }) => {
  await page.goto(`${BASE}&frame=0`, { waitUntil: 'networkidle' })
  await page.getByTestId('daimon-start').click()
  await page.getByTestId('daimon-request-input').fill('а'.repeat(450))
  await expect(page.getByTestId('daimon-request-counter')).toHaveText('450/500')
  await page.getByTestId('daimon-request-input').fill('а'.repeat(501))
  await expect(page.getByTestId('daimon-request-submit')).toBeDisabled()
  await page.getByTestId('daimon-request-input').fill('Запрос для игры')
  await page.getByTestId('daimon-request-submit').click()
  await page.getByTestId('daimon-help-done').click()
  await page.getByTestId('daimon-roll').click()
  await answerCell(page)
  await page.getByTestId('daimon-insight-input').fill('а'.repeat(250))
  await expect(page.getByTestId('daimon-insight-counter')).toHaveText('250/300')
  await page.getByTestId('daimon-insight-input').fill('а'.repeat(301))
  await expect(page.getByTestId('daimon-insight-submit')).toBeDisabled()
})

test('409 на броске подхватывает pending-клетку из другой сессии без ошибки', async ({ page }) => {
  await openMode(page, 'nearSnake')
  await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key))
    state.daimon.game.pending_move_id = 'other-session-move'
    state.daimon.game.position = 11
    state.daimon.game.moves.push({ id: 'other-session-move', from: 10, to: 11, cell: 11, roll: 1 })
    localStorage.setItem(key, JSON.stringify(state))
  }, stateKey('nearSnake'))
  await page.getByTestId('daimon-roll').click()
  await expect(page.getByTestId('daimon-cell-title')).toBeVisible()
  await expect(page.getByTestId('daimon-chat-error')).toBeHidden()
  expect((await storedGame(page, 'nearSnake')).pending_move_id).toBe('other-session-move')
})

test('бросок зажигает огонёк Сегодня без перезагрузки страницы', async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('mentalix:demo-scenario:v1', 'Новый пользователь')
  )
  await page.goto('http://127.0.0.1:5173/?demo=1&frame=0', { waitUntil: 'networkidle' })
  await expect(page.getByTestId('today-streak-chip')).toHaveClass(/--empty/)
  await page.evaluate(() => {
    history.pushState({}, '', '/?demo=1&frame=0&tab=practices&sub=daimon&daimonTest=nearSnake')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.getByTestId('daimon-roll').click()
  await expect(page.getByTestId('daimon-chat-input')).toBeVisible()
  await page.getByTestId('back-button').click()
  await page.getByTestId('back-button').click()
  await page.getByRole('button', { name: 'Сегодня', exact: true }).click()
  await expect(page.getByTestId('today-streak-chip')).not.toHaveClass(/--empty/)
  await expect(page.locator('[data-testid="today-week-day"][data-today="true"]')).toHaveAttribute(
    'data-completed',
    'true'
  )
})
