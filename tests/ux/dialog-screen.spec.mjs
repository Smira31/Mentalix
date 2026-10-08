import { expect, test } from '@playwright/test'

import { DIALOG_STARTER_CHIPS } from '../../src/data/prompts.js'

/*
 * Экран «Диалог» (вкладка Наставник): карусель ролей, блок «Продолжить
 * разговор», стартовые чипсы и чат. Всё на data-testid, без waitForTimeout.
 * Демо: ?demo=1 даёт 3 разговора разных ролей с историей.
 */

test.use({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
})

async function openDialog(page) {
  await page.goto('/?demo=1&tab=mentor')
  await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })
}

test.describe('Диалог — экран выбора роли', () => {
  test('страница «Диалога» листается целиком', async ({ page }) => {
    await openDialog(page)

    const scrollRoot = page.getByTestId('app-scroll-root')
    const metrics = await scrollRoot.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)

    await page.mouse.move(196, 140)
    await page.mouse.wheel(0, 900)

    await expect.poll(() => scrollRoot.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  })

  test('четыре карточки, последняя — Даймон', async ({ page }) => {
    await openDialog(page)

    const cards = page.getByTestId('mentor-persona-card')
    await expect(cards).toHaveCount(4)
    await expect(cards.nth(0)).toContainText('Наставник')
    await expect(cards.nth(1)).toContainText('Спутник')
    await expect(cards.nth(2)).toContainText('Наблюдатель')
    await expect(cards.nth(3)).toContainText('Даймон')

    await expect(cards.nth(1)).toContainText('Выслушает, когда нужно выговориться.')
    await expect(cards.nth(3)).toContainText('Брось кубик и узнай, где ты сейчас.')
  })

  test('«Начать» у Спутника открывает пустой чат', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('mentor-start-mayak').click()

    await expect(page.getByTestId('mentor-input')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Спутник' })).toBeVisible()
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(0)
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0)
  })

  test('стартовый чипс открывает чат с длинным текстом в поле, но без отправки', async ({ page }) => {
    await openDialog(page)

    const chip = page.getByTestId('dialog-starter-chip').first()
    await expect(chip).toBeVisible()
    // Надпись чипса — короткая (2–3 слова), а в поле уходит прежний стартер роли.
    const chipLabel = (await chip.innerText()).trim()
    expect(chipLabel.length).toBeGreaterThan(0)
    expect(chipLabel.split(/\s+/).length).toBeLessThanOrEqual(4)
    // MXL-DIALOG-CHIPS-002: у чипса закреплён свой фиксированный длинный
    // стартер (не дневная ротация pickByDay), он и уходит в поле ввода.
    const expectedDraft = DIALOG_STARTER_CHIPS[0].starter

    await chip.click()

    const input = page.getByTestId('mentor-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue(expectedDraft)
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0)
    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(0)
  })

  test('чипсы встают облаком в 2–3 ряда и не переносят текст', async ({ page }) => {
    await openDialog(page)

    const chips = page.getByTestId('dialog-starter-chip')
    await expect(chips).toHaveCount(5)

    const metrics = await chips.evaluateAll(elements =>
      elements.map(element => ({
        row: Math.round(element.getBoundingClientRect().top),
        overflow: element.scrollWidth - element.clientWidth,
      }))
    )

    const rows = new Set(metrics.map(item => item.row)).size
    expect(rows, 'Чипсы должны вставать в 2–3 ряда').toBeGreaterThanOrEqual(2)
    expect(rows, 'Чипсы должны вставать в 2–3 ряда').toBeLessThanOrEqual(3)
    for (const item of metrics) {
      expect(item.overflow, 'Ни один чипс не переносит текст').toBeLessThanOrEqual(0)
    }
  })

  test('«Продолжить разговор» в демо открывает разговор с историей', async ({ page }) => {
    await openDialog(page)

    const block = page.getByTestId('continue-conversation-block')
    await expect(block).toBeVisible()

    const rows = page.getByTestId('continue-conversation-row')
    await expect(rows).toHaveCount(3)
    await expect(rows.first()).toContainText('Спутник')
    await expect(rows.first()).toContainText('вчера')

    await rows.first().click()

    await expect(page.getByTestId('mentor-input')).toBeVisible()
    await expect(page.getByTestId('chat-message-assistant').first()).toBeVisible()
  })

  test('«Новый разговор» очищает чат', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('continue-conversation-row').first().click()
    await expect(page.getByTestId('chat-message-assistant').first()).toBeVisible()

    await page.getByTestId('conversation-new-pill').click()

    await expect(page.getByTestId('chat-message-assistant')).toHaveCount(0)
    await expect(page.getByTestId('chat-message-user')).toHaveCount(0)
  })

  test('над ответами нет метки имени роли — только пузырь', async ({ page }) => {
    await openDialog(page)

    await page.getByTestId('continue-conversation-row').first().click()

    const assistantRow = page.getByTestId('chat-message-assistant').first()
    await expect(assistantRow).toBeVisible()
    await expect(assistantRow.locator(':scope > *').first()).toHaveAttribute(
      'data-testid',
      'chat-message-bubble'
    )
  })
})
