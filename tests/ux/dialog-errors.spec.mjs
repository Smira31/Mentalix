import { expect, test } from '@playwright/test'

/*
 * Аудит надёжности «Диалога»: детерминированные сбои через ?dialogTest=
 * (см. src/lib/demoMode.js). Каждый сбой одноразовый — проверяем, что
 * «Повторить» действительно повторяет запрос и он проходит, а неудачная
 * реплика не теряется. Только data-testid, без waitForTimeout.
 */

test.use({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
})

const BASE = '/?demo=1&tab=mentor'

async function openDialog(page, mode) {
  await page.goto(`${BASE}&dialogTest=${mode}`)
  await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })
}

test.describe('Диалог — сбои и повтор', () => {
  test('история разговора: баннер и «Повторить» грузят историю', async ({ page }) => {
    await openDialog(page, 'historyError')

    await page.getByTestId('continue-conversation-row').first().click()

    const notice = page.getByTestId('conversation-history-error')
    await expect(notice).toBeVisible()
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(0)

    await page.getByTestId('conversation-history-retry').click()

    await expect(notice).toHaveCount(0)
    await expect(page.getByTestId('chat-message-assistant').first()).toBeVisible()
  })

  test('«Продолжить разговор»: баннер и «Повторить» возвращают список', async ({ page }) => {
    await openDialog(page, 'listError')

    const notice = page.getByTestId('continue-conversation-error')
    await expect(notice).toBeVisible()
    await expect(page.getByTestId('continue-conversation-block')).toHaveCount(0)

    await page.getByTestId('continue-conversation-retry').click()

    await expect(notice).toHaveCount(0)
    await expect(page.getByTestId('continue-conversation-row')).toHaveCount(3)
  })

  test('«Все разговоры»: сбой списка — не пустой экран, а «Повторить»', async ({ page }) => {
    await openDialog(page, 'listError')

    // Первый запрос (limit 4) падает один раз — повтор открывает блок.
    await page.getByTestId('continue-conversation-retry').click()
    await expect(page.getByTestId('continue-conversation-block')).toBeVisible()
    await page.getByTestId('all-conversations-link').click()

    const notice = page.getByTestId('all-conversations-error')
    await expect(notice).toBeVisible()
    await expect(page.getByTestId('all-conversations-list')).toHaveCount(0)

    await page.getByTestId('all-conversations-retry').click()

    await expect(notice).toHaveCount(0)
    await expect(page.getByTestId('conversation-row')).toHaveCount(4)
  })

  test('отправка: «Не отправлено» у пузыря и повтор без дубля', async ({ page }) => {
    await page.goto(`${BASE}&dialogTest=sendError`)
    await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })
    await page.getByTestId('continue-conversation-row').first().click()
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(2)

    await page.getByTestId('mentor-input').fill('Проверка отправки')
    await page.getByTestId('mentor-composer-action').click()

    const failed = page.getByTestId('chat-message-failed')
    await expect(failed).toBeVisible()

    // Второй сбой подряд: повтор снова помечает пузырь «Не отправлено».
    await page.getByTestId('chat-message-retry').click()
    await expect(failed).toBeVisible()

    // Третья попытка проходит: ответ пришёл, дублей реплики нет.
    await page.getByTestId('chat-message-retry').click()
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(3)
    await expect(failed).toHaveCount(0)
    await expect(page.getByTestId('chat-message-user')).toHaveCount(3)
  })

  test('дневной лимит: сообщение не уходит, текст возвращается, поле блокируется', async ({
    page,
  }) => {
    await page.goto(`${BASE}&dialogTest=dailyLimit`)
    await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })
    await page.getByTestId('continue-conversation-row').first().click()
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(2)

    await page.getByTestId('mentor-input').fill('Лимит на сегодня')
    await page.getByTestId('mentor-composer-action').click()

    await expect(page.getByTestId('daily-limit-notice')).toBeVisible()
    await expect(page.getByTestId('mentor-input')).toBeDisabled()
    await expect(page.getByTestId('mentor-input')).toHaveValue('Лимит на сегодня')
    // Пузырь снят, лишних POST нет — ровно одна попытка отправки.
    await expect(page.getByTestId('chat-message-user')).toHaveCount(2)
    expect(await page.evaluate(() => window.__mxDemoMessagePosts)).toBe(1)
  })

  test('сбой создания: реплика не теряется — уходит после повтора', async ({ page }) => {
    await openDialog(page, 'createError')

    // Создание при входе упало один раз — чат открылся без разговора.
    await page.getByTestId('mentor-start-mayak').click()
    await expect(page.getByTestId('mentor-input')).toBeVisible()
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0)

    await page.getByTestId('mentor-input').fill('Реплика после сбоя')
    await page.getByTestId('mentor-composer-action').click()

    // Разговор доводится дозапросом — реплика отправляется и получает ответ.
    await expect(page.getByTestId('chat-message-user')).toHaveCount(1)
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(1)
    await expect(page.getByTestId('chat-message-failed')).toHaveCount(0)
  })
})
