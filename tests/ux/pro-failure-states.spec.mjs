import { test, expect } from '@playwright/test'

/*
 * PRO-002b/c — регрессии недоступного и некорректного ответа API Pro.
 *
 * Проверяется не «красивый» путь, а отказы:
 *   network   — сбой сети: состояние ошибки с понятным повтором, повторных
 *               POST экран не отправляет;
 *   nopayload — ответ не является состоянием Pro (пустой массив — форма ответа,
 *               на которой в превью появлялось «неделя NaN undefined»):
 *               состояние ошибки с повтором, без подписи недели;
 *   nodates   — даты недели отсутствуют или нераспознаны: содержимое экрана
 *               показывается, а название недели не строится;
 *   version_conflict — ввод правки не теряется при отказе сохранения.
 *
 * Во всех случаях в интерфейсе не должно быть ни «NaN», ни «undefined».
 * Запуск в web-контейнере: npm run ux:pro-failure-states
 */

const MOCK_STATE_KEY = 'mx-pro-mock-state:v1'

/* «Прогресс» → «Аналитика» → карточка «Разбор и план недели». Вход тот же, что у пользователя. */
async function openPro(page, scenario) {
  await page.addInitScript(key => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* хранилище недоступно — состояние и так пустое */
    }
  }, MOCK_STATE_KEY)

  await page.goto(`/?demo=1&frame=0&proMock=${scenario}`)
  await expect(page.getByRole('button', { name: 'Прогресс' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Прогресс' }).click()
  await expect(page.getByTestId('progress-pro-card')).toBeVisible()
  await page.getByTestId('progress-pro-card').click()
  await expect(page.locator('.mx-page-title')).toContainText('мой разбор.')
}

/** Согласие → сборка разбора. */
async function buildReport(page) {
  await page.getByTestId('pro-consent-enable').click()
  await expect(page.getByTestId('pro-generate-report')).toBeVisible()
  await page.getByTestId('pro-generate-report').click()
}

/** Согласие → разбор → план недели. */
async function buildPlan(page) {
  await buildReport(page)
  await expect(page.getByTestId('pro-open-plan')).toBeVisible()
  await page.getByTestId('pro-open-plan').click()
  await expect(page.getByTestId('pro-generate-plan')).toBeVisible()
  await page.getByTestId('pro-generate-plan').click()
  await expect(page.getByTestId('pro-plan-progress')).toBeVisible()
}

/** В тексте интерфейса нет ни «NaN», ни «undefined». */
async function expectNoBrokenNumbers(page, label) {
  const text = await page.locator('body').innerText()
  expect(text, `${label}: «NaN» в интерфейсе`).not.toContain('NaN')
  expect(text, `${label}: «undefined» в интерфейсе`).not.toContain('undefined')
}

/** Счётчики запросов mock: регрессии проверяют отсутствие лишних POST. */
async function mockCounters(page) {
  return page.evaluate(() => ({
    gets: window.__mxProMockGets || 0,
    posts: window.__mxProMockPosts || 0,
  }))
}

test('сбой сети: состояние ошибки с повтором, без лишних POST', async ({ page }) => {
  await openPro(page, 'network')

  const errorCard = page.getByText('Не удалось загрузить состояние разбора.')
  await expect(errorCard).toBeVisible()
  await expect(page.getByTestId('pro-report-week')).toHaveCount(0)
  await expectNoBrokenNumbers(page, 'сбой сети')

  const before = await mockCounters(page)
  await page.getByRole('button', { name: 'Повторить' }).click()
  await expect(errorCard).toBeVisible()

  const after = await mockCounters(page)
  expect(after.gets, '«Повторить» повторяет запрос состояния').toBeGreaterThan(before.gets)
  expect(after.posts, 'отказ не запускает сборку').toBe(0)
})

test('ответ без состояния Pro: ошибка с повтором и без подписи недели', async ({ page }) => {
  await openPro(page, 'nopayload')

  await expect(page.getByText('Не удалось загрузить состояние разбора.')).toBeVisible()
  await expect(page.getByTestId('pro-report-week')).toHaveCount(0)
  // Ответ без статуса — не «незнакомый статус»: данные не доставлены.
  await expect(page.getByText('Неожиданное состояние')).toHaveCount(0)
  await expectNoBrokenNumbers(page, 'ответ без состояния')

  const counters = await mockCounters(page)
  expect(counters.posts, 'отсутствующие данные не запускают сборку').toBe(0)
})

test('отсутствующие и нераспознанные даты: название недели не строится', async ({ page }) => {
  await openPro(page, 'nodates')

  // Разбор: содержимое есть, дат недели сервер не прислал.
  await expect(page.getByText('Направление на неделю')).toBeVisible()
  await expect(page.getByTestId('pro-report-week')).toHaveCount(0)
  await expectNoBrokenNumbers(page, 'разбор без дат')

  // План: дата недели нераспознана — заголовка недели нет, дни на месте.
  await page.getByTestId('pro-open-plan').click()
  await expect(page.getByTestId('pro-plan-progress')).toBeVisible()
  await expect(page.getByTestId('pro-plan-week')).toHaveCount(0)
  await expect(page.getByTestId('pro-plan-day')).toHaveCount(7)
  await expectNoBrokenNumbers(page, 'план с нераспознанной датой')

  // Прогресс: plan_week_start отсутствует — подпись без выдуманных чисел.
  await page.getByTestId('pro-open-progress').click()
  const completion = page.getByTestId('pro-progress-completion')
  await expect(completion).toBeVisible()
  await expect(completion).toContainText('Неделя действий')
  await expect(completion).not.toContainText('неделя')
  await expectNoBrokenNumbers(page, 'прогресс без даты недели')

  const counters = await mockCounters(page)
  expect(counters.posts, 'просмотр состояний не запускает сборку').toBe(0)
})

test('ввод правки сохраняется при отказе сохранения', async ({ page }) => {
  await openPro(page, 'version_conflict')
  await buildPlan(page)

  const draft = 'Проверка сохранения ввода при отказе'
  await page.getByTestId('pro-day-1-edit').click()
  await page.getByTestId('pro-plan-edit-input').fill(draft)
  await page.getByTestId('pro-plan-edit-save').click()

  await expect(page.getByTestId('pro-conflict-card')).toBeVisible()
  await expect(page.getByTestId('pro-plan-edit-input')).toHaveValue(draft)
  await expectNoBrokenNumbers(page, 'конфликт версий')
})
