import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true })

async function openChat(page, mode) {
  await page.goto(`/?demo=1&tab=mentor&dialogTest=${mode}`)
  await expect(page.getByTestId('dialog-entry')).toBeVisible()
  await page.getByTestId('mentor-start-mayak').click()
  await expect(page.getByTestId('mentor-input')).toBeVisible()
}

async function demoState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mentalix_preview_demo_state_v6')))
}

async function screenshot(page, name) {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `artifacts/dialog-${name}-393x852.png` })
}

test('ошибка создания видна в чате; повтор создаёт пустой разговор', async ({ page }) => {
  await openChat(page, 'createError')
  await expect(page.getByTestId('conversation-create-error')).toBeVisible()
  await expect(page.getByTestId('mentor-send')).toBeDisabled()
  await expect(page.getByTestId('chat-message-user')).toHaveCount(0)
  await screenshot(page, 'create-error')
  await page.getByTestId('conversation-create-retry').click()
  await expect(page.getByTestId('conversation-create-error')).toHaveCount(0)
  await expect(page.getByTestId('mentor-input')).toBeEnabled()
  const state = await demoState(page)
  expect(state.conversations).toHaveLength(4)
  expect(state.conversations[0].messages).toHaveLength(0)
})

test('ошибка отправки: повтор сохраняет одну реплику пользователя', async ({ page }) => {
  await openChat(page, 'sendError')
  await page.getByTestId('mentor-input').fill('Хочу разобраться в своих мыслях.')
  await page.getByTestId('mentor-send').click()
  await expect(page.getByTestId('conversation-send-error')).toContainText('Не отправлено ·')
  await expect(page.getByTestId('conversation-send-retry')).toBeVisible()
  await expect(page.getByTestId('chat-message-user')).toHaveCount(1)
  await screenshot(page, 'send-error')
  await page.getByTestId('conversation-send-retry').click()
  await expect(page.getByTestId('conversation-send-error')).toHaveCount(0)
  await expect(page.getByTestId('chat-message-assistant')).toHaveCount(1)
  await expect(page.getByTestId('chat-message-user')).toHaveCount(1)
  const state = await demoState(page)
  expect(state.conversations[0].messages.filter(message => message.role === 'user')).toHaveLength(1)
})

test('429: текст сохранён, поле и отправка погашены', async ({ page }) => {
  await openChat(page, 'dailyLimit')
  const text = 'Продолжим разговор завтра.'
  await page.getByTestId('mentor-input').fill(text)
  await page.getByTestId('mentor-send').click()
  await expect(page.getByTestId('daily-limit-notice')).toBeVisible()
  await expect(page.getByTestId('mentor-input')).toHaveValue(text)
  await expect(page.getByTestId('mentor-input')).toBeDisabled()
  await expect(page.getByTestId('mentor-send')).toBeDisabled()
  await screenshot(page, '429')
  const state = await demoState(page)
  expect(state.conversations[0].messages).toHaveLength(0)
})

test('Даймон из Диалога возвращает в Диалог', async ({ page }) => {
  await page.goto('/?demo=1&tab=mentor')
  await expect(page.getByTestId('dialog-entry')).toBeVisible()
  await page.getByTestId('mentor-start-daimon').click()
  await expect(page.getByTestId('daimon-start')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('dialog-entry')).toBeVisible()
  await expect(page.getByTestId('daimon-start')).toHaveCount(0)
  await expect(page).toHaveURL(/tab=mentor/)
})

test('Даймон из Шагов возвращает в Шаги', async ({ page }) => {
  await page.goto('/?demo=1&tab=practices')
  await page.getByTestId('steps-practice-daimon').click()
  await expect(page.getByTestId('daimon-start')).toBeVisible()
  await page.getByTestId('back-button').click()
  await expect(page.getByTestId('steps-practice-daimon')).toBeVisible()
  await expect(page.getByTestId('daimon-start')).toHaveCount(0)
  await expect(page).toHaveURL(/tab=practices/)
})
