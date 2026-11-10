import { expect, test } from '@playwright/test'

/*
 * Issue #1169 — «Доступ ИИ к записям».
 *
 * Четыре сценария задачи, каждый на своих 393×852 и 360×640:
 *   1. карточка в «Диалоге» → «Разрешить» → доступ включён;
 *   2. Профиль → «Приватность» → переключатель выключить → выключено;
 *   3. «Не сейчас» → карточка не показывается снова;
 *   4. после реплики собеседника с меткой crisis карточки нет.
 *
 * Демо-режим даёт пользователя и чат без backend; платформа Telegram —
 * TelegramWebviewProxy (так же, как в connection-offline-state). Никаких
 * waitForTimeout: только ожидание состояния.
 */

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

const SHOTS = 'qa-evidence/ai-context-consent'

async function openTelegramDemo(browser, viewport, query = '') {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(() => {
    // Платформа Telegram без настоящего клиента: platform.name === 'telegram'.
    window.TelegramWebviewProxy = { postEvent() {} }
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  })

  const page = await context.newPage()
  await page.goto(`/?demo=1${query}`)

  return { context, page }
}

async function openChatWithCompanion(page) {
  await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('mentor-start-mayak').click()
  await expect(page.getByTestId('mentor-input')).toBeVisible()
}

async function openProfileData(page) {
  await expect(page.getByTestId('today-profile-button')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
  await page.getByTestId('profile-row-data').click()
  await expect(page.getByTestId('profile-sub-data')).toBeVisible()
}

test('вне Telegram поведение не меняется: ни карточки, ни группы «Приватность»', async ({
  browser,
}) => {
  // Тот же демо-режим, но без TelegramWebviewProxy — платформа web.
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })
  await context.addInitScript(() => {
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  })
  const page = await context.newPage()

  try {
    await page.goto('/?demo=1&tab=mentor')
    await openChatWithCompanion(page)
    await expect(page.getByTestId('ai-consent-card')).toHaveCount(0)

    await page.goto('/?demo=1')
    await openProfileData(page)
    await expect(page.getByTestId('profile-ai-consent-row')).toHaveCount(0)
    await expect(page.getByTestId('profile-sub-data')).not.toContainText('Приватность')
  } finally {
    await context.close()
  }
})

for (const viewport of VIEWPORTS) {
  test.describe(`Доступ ИИ к записям — ${viewport.name}`, () => {
    test('карточка в «Диалоге»: «Разрешить» включает доступ и карточка исчезает', async ({
      browser,
    }) => {
      const { context, page } = await openTelegramDemo(browser, viewport, '&tab=mentor')

      try {
        await openChatWithCompanion(page)

        const card = page.getByTestId('ai-consent-card')
        await expect(card).toBeVisible()
        await expect(card).toContainText('Показать собеседникам твои записи?')
        // animations: 'disabled' — кадр снимается после завершения входных
        // анимаций экрана; без этого на 360×640 первый кадр мог быть пустым.
        await page.screenshot({ path: `${SHOTS}/${viewport.name}-card.png`, animations: 'disabled' })

        await page.getByTestId('ai-consent-allow').click()
        await expect(page.getByTestId('ai-consent-card')).toHaveCount(0)

        // Состояние доступа сохранено сервером: после перезагрузки карточки нет.
        await page.reload()
        await openChatWithCompanion(page)
        await expect(page.getByTestId('ai-consent-card')).toHaveCount(0)

        // И в профиле переключатель показывает включённый доступ.
        await page.goto('/?demo=1')
        await openProfileData(page)
        await expect(page.getByTestId('profile-ai-consent-toggle')).toHaveAttribute(
          'aria-checked',
          'true'
        )
      } finally {
        await context.close()
      }
    })

    test('Профиль → «Приватность»: выключение в одно касание', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)

      try {
        await openProfileData(page)

        await expect(page.getByTestId('profile-ai-consent-row')).toContainText(
          'Доступ ИИ к записям'
        )

        const toggle = page.getByTestId('profile-ai-consent-toggle')
        await expect(toggle).toHaveAttribute('aria-checked', 'false')

        await toggle.click()
        await expect(toggle).toHaveAttribute('aria-checked', 'true')
        await page.getByTestId('profile-ai-consent-row').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-profile-on.png`,
          animations: 'disabled',
        })

        await toggle.click()
        await expect(toggle).toHaveAttribute('aria-checked', 'false')
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-profile-off.png`,
          animations: 'disabled',
        })

        // Выключение сохранилось на сервере, а не только в состоянии экрана.
        await page.reload()
        await openProfileData(page)
        await expect(page.getByTestId('profile-ai-consent-toggle')).toHaveAttribute(
          'aria-checked',
          'false'
        )
      } finally {
        await context.close()
      }
    })

    test('«Не сейчас» скрывает карточку на 7 дней', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport, '&tab=mentor')

      try {
        await openChatWithCompanion(page)
        await expect(page.getByTestId('ai-consent-card')).toBeVisible()

        await page.getByTestId('ai-consent-snooze').click()
        await expect(page.getByTestId('ai-consent-card')).toHaveCount(0)

        const snoozed = await page.evaluate(() => {
          const key = Object.keys(localStorage).find(name =>
            name.startsWith('mx-ai-consent-snooze-v1')
          )
          return key ? Number(localStorage.getItem(key)) : 0
        })
        expect(snoozed).toBeGreaterThan(0)

        // Отметка переживает перезагрузку: карточка не возвращается.
        await page.reload()
        await openChatWithCompanion(page)
        await expect(page.getByTestId('ai-consent-card')).toHaveCount(0)
      } finally {
        await context.close()
      }
    })

    test('после реплики собеседника с crisis карточки нет', async ({ browser }) => {
      // ?dialogTest=crisis: ответ собеседника приходит с меткой crisis: true,
      // которую «Диалог» уже читает у реплики (message.crisis).
      const { context, page } = await openTelegramDemo(
        browser,
        viewport,
        '&tab=mentor&dialogTest=crisis'
      )

      try {
        await openChatWithCompanion(page)

        const card = page.getByTestId('ai-consent-card')
        await expect(card).toBeVisible()

        await page.getByTestId('mentor-input').fill('Мне сейчас очень тяжело')
        await page.getByTestId('mentor-composer-action').click()

        await expect(page.getByTestId('chat-message-assistant').last()).toBeVisible()
        await expect(card).toHaveCount(0)
      } finally {
        await context.close()
      }
    })
  })
}
