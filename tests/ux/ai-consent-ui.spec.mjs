import { expect, test } from '@playwright/test'

/*
 * Приватность — «Доступ ИИ к записям». Единственная поверхность согласия —
 * Профиль → «твои данные.» → «Приватность»: переключатель и окно согласия.
 * В «Диалоге» о доступе нет ничего — ни карточки, ни строки, ни значка.
 *
 * Сценарии задачи, каждый на своих 393×852 и 360×640:
 *   1. «Диалог» пуст от согласия у всех трёх собеседников и при выключенном
 *      доступе (демо-сервер стартует с выключенным согласием);
 *   2. включение переключателя без подтверждения в окне не отправляет
 *      PUT /api/mentalix/consent и не переживает перезагрузку;
 *   3. «Включить» в окне сохраняет доступ; «Диалог» остаётся без поверхности;
 *   4. выключение сохраняется сразу, без окна.
 *
 * Демо-режим (?demo=1) отвечает на /mentalix/consent сам (src/lib/demoMode.js),
 * поэтому сетевого запроса в тесте нет: «не отправлен» проверяется по
 * состоянию демо-сервера в localStorage (оно переживает перезагрузку) и по
 * повторному чтению после reload. Платформа Telegram включается заменой
 * TelegramWebviewProxy — без неё поверхность согласия по условию не видна.
 * Никаких waitForTimeout: только ожидание состояния.
 */

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

const SHOTS = 'qa-evidence/ai-context-consent'

const SWITCH_TITLE = 'Собеседники видят мои записи'
const DIALOG_TITLE = 'Собеседники увидят твои записи'

// Собеседники, в разговоре с которыми раньше спрашивали согласие.
const PERSONAS = ['mayak', 'kompas', 'dnevnik']

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

async function openChatWithCompanion(page, persona = 'mayak') {
  await expect(page.getByTestId('dialog-entry')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId(`mentor-start-${persona}`).click()
  await expect(page.getByTestId('mentor-input')).toBeVisible()
}

async function openProfileData(page) {
  await expect(page.getByTestId('today-profile-button')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
  await page.getByTestId('profile-row-data').click()
  await expect(page.getByTestId('profile-sub-data')).toBeVisible()
}

/* Ни одного следа согласия в «Диалоге». */
async function expectNoConsentSurface(page) {
  await expect(page.getByTestId('ai-consent-card')).toHaveCount(0)
  await expect(page.getByTestId('ai-consent-line')).toHaveCount(0)
  await expect(page.getByTestId('ai-consent-allow')).toHaveCount(0)
  await expect(page.getByTestId('ai-consent-configure')).toHaveCount(0)
}

/*
 * Состояние согласия проверяется перезагрузкой и повторным чтением
 * переключателя, а не по конкретному хранилищу: в песочнице согласие
 * обслуживает dev-мок Pro (VITE_PRO_MOCK), в CI — демо-ответы
 * src/lib/demoMode.js. Оба переживают reload.
 */

async function openConsentDialog(page) {
  const toggle = page.getByTestId('profile-ai-consent-toggle')
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await toggle.click()

  const dialog = page.getByTestId('ai-consent-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(DIALOG_TITLE)

  return { toggle, dialog }
}

test('вне Telegram поведение не меняется: ни поверхности в «Диалоге», ни группы «Приватность»', async ({
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
    await expectNoConsentSurface(page)

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
    test('в «Диалоге» нет карточки и строки — у всех собеседников', async ({ browser }) => {
      for (const persona of PERSONAS) {
        const { context, page } = await openTelegramDemo(browser, viewport, '&tab=mentor')

        try {
          await openChatWithCompanion(page, persona)

          // Доступ по умолчанию выключен (демо-сервер стартует с 'off'), но
          // в «Диалоге» об этом не говорится ничего.
          await expectNoConsentSurface(page)
          await expect(page.getByTestId('mentor-input')).toBeVisible()

          if (persona === 'mayak') {
            // Кадр «Диалог без карточки»: animations: 'disabled' — снимаем
            // после входных анимаций, иначе кадр может оказаться пустым.
            await page.screenshot({
              path: `${SHOTS}/${viewport.name}-dialog.png`,
              animations: 'disabled',
            })
          }
        } finally {
          await context.close()
        }
      }
    })

    test('включение переключателя без подтверждения в окне не отправляет PUT /api/mentalix/consent', async ({
      browser,
    }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)

      try {
        await openProfileData(page)

        const { toggle, dialog } = await openConsentDialog(page)
        await expect(dialog).toBeVisible()
        // Окно с длинным текстом целиком помещается в экран.
        const dialogBox = await dialog.boundingBox()
        expect(dialogBox.y).toBeGreaterThanOrEqual(0)
        expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height)
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-consent-dialog.png`,
          animations: 'disabled',
        })

        await dialog.getByTestId('ai-consent-dialog-cancel').click()
        await expect(dialog).toHaveCount(0)

        // Переключатель остался выключенным.
        await expect(toggle).toHaveAttribute('aria-checked', 'false')

        // И после перезагрузки доступа нет — PUT действительно не ушёл,
        // а не просто не изменил состояние экрана.
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

    test('«Включить» в окне сохраняет доступ', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)

      try {
        await openProfileData(page)

        const { toggle, dialog } = await openConsentDialog(page)
        await dialog.getByTestId('ai-consent-dialog-confirm').click()
        await expect(dialog).toHaveCount(0)

        await expect(toggle).toHaveAttribute('aria-checked', 'true')

        // «Включить» сохранило доступ на сервере, а не только на экране.
        await page.reload()
        await openProfileData(page)
        await expect(page.getByTestId('profile-ai-consent-toggle')).toHaveAttribute(
          'aria-checked',
          'true'
        )

        await page.getByTestId('profile-ai-consent-row').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-profile-on.png`,
          animations: 'disabled',
        })

        // «Диалог» и при включённом доступе о согласии молчит.
        await page.goto('/?demo=1&tab=mentor')
        await openChatWithCompanion(page)
        await expectNoConsentSurface(page)
      } finally {
        await context.close()
      }
    })

    test('выключение сохраняется сразу, без окна', async ({ browser }) => {
      const { context, page } = await openTelegramDemo(browser, viewport)

      try {
        // Сначала включаем через окно, иначе выключать нечего.
        await openProfileData(page)
        const first = await openConsentDialog(page)
        await first.dialog.getByTestId('ai-consent-dialog-confirm').click()
        await expect(first.toggle).toHaveAttribute('aria-checked', 'true')

        await page.reload()
        await openProfileData(page)

        const toggle = page.getByTestId('profile-ai-consent-toggle')
        await expect(toggle).toHaveAttribute('aria-checked', 'true')

        await toggle.click()
        // Выключение — без окна согласия.
        await expect(page.getByTestId('ai-consent-dialog')).toHaveCount(0)
        await expect(toggle).toHaveAttribute('aria-checked', 'false')

        await page.getByTestId('profile-ai-consent-row').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-profile-off.png`,
          animations: 'disabled',
        })

        // Выключение сохранено на сервере, а не только в состоянии экрана.
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
  })
}
