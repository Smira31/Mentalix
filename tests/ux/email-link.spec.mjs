import { expect, test } from '@playwright/test'

/*
 * Issue #1189 — «Почта для входа» в Профиле → «твои данные.».
 *
 * Сценарии: добавить → код из письма → привязана → отвязать; ветка
 * 409 email_in_use; неверный код; в вебе строки нет. Поиск элементов —
 * только по data-testid (текст проверяется внутри найденного узла).
 *
 * Демо-режим (?demo=1) отвечает на /auth/email-link без backend: код 123456,
 * адрес taken@example.com занят. Платформа Telegram включается
 * TelegramWebviewProxy — без неё строки по условию задачи нет вовсе.
 */

const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '360x640', width: 360, height: 640 },
]

const SHOTS = 'qa-evidence/email-link'
const NEW_EMAIL = 'preview-link@example.com'
const TAKEN_EMAIL = 'taken@example.com'
const CODE = '123456'

async function createContext(browser, viewport, telegram = true) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  })

  await context.addInitScript(telegram => {
    if (telegram) window.TelegramWebviewProxy = { postEvent() {} }
    localStorage.setItem('mx-onboarded-v2', '1')
    localStorage.setItem('mx-app-lock-enabled', '0')
  }, telegram)

  return context
}

async function openProfileData(page) {
  await expect(page.getByTestId('today-profile-button')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('today-profile-button').click()
  await expect(page.getByTestId('profile-screen')).toBeVisible()
  await page.getByTestId('profile-row-data').click()
  await expect(page.getByTestId('profile-sub-data')).toBeVisible()
}

async function openEmailLinkScreen(page) {
  const row = page.getByTestId('profile-email-link-row')
  await expect(row).toBeVisible()
  await row.scrollIntoViewIfNeeded()
  await row.click()
  await expect(page.getByTestId('email-link-screen')).toBeVisible()
}

// 1. Попадание в демо: в вебе и без флага строки нет.
test('вне Telegram строки «Почта для входа» нет', async ({ browser }) => {
  const context = await createContext(browser, VIEWPORTS[0], false)
  const page = await context.newPage()

  try {
    await page.goto('/?demo=1')
    await openProfileData(page)
    await expect(page.getByTestId('profile-email-link-row')).toHaveCount(0)
    await expect(page.getByTestId('profile-sub-data')).not.toContainText('Почта для входа')
  } finally {
    await context.close()
  }
})

for (const viewport of VIEWPORTS) {
  test.describe(`Почта для входа — ${viewport.name}`, () => {
    // 2. Полный поток: добавить → код → привязана → отвязать.
    test('добавить почту, подтвердить кодом и отвязать', async ({ browser }) => {
      const context = await createContext(browser, viewport)
      const page = await context.newPage()

      try {
        await page.goto('/?demo=1')
        await openProfileData(page)

        const row = page.getByTestId('profile-email-link-row')
        await expect(row).toContainText('Почта для входа')
        await expect(row).toContainText('Добавить')
        await expect(row).toContainText('Чтобы входить на сайте mentalix.space по почте')
        await row.scrollIntoViewIfNeeded()
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-1-empty.png`,
          animations: 'disabled',
        })

        await openEmailLinkScreen(page)
        await expect(page.getByTestId('email-link-email-field')).toHaveAttribute('type', 'email')
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-2-email.png`,
          animations: 'disabled',
        })

        await page.getByTestId('email-link-email-field').fill(NEW_EMAIL)
        await page.getByTestId('email-link-request-code').click()

        const codeField = page.getByTestId('email-link-code-field')
        await expect(codeField).toBeVisible()
        await expect(codeField).toHaveAttribute('inputmode', 'numeric')
        await expect(codeField).toHaveAttribute('autocomplete', 'one-time-code')
        // Отсчёт от метки времени: сразу после отправки повтор недоступен.
        await expect(page.getByTestId('email-link-resend')).toBeDisabled()
        await expect(page.getByTestId('email-link-resend')).toContainText('Отправить код ещё раз')
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-3-code.png`,
          animations: 'disabled',
        })

        await codeField.fill(CODE)
        await page.getByTestId('email-link-verify').click()

        await expect(page.getByTestId('email-link-screen')).toHaveCount(0)
        await expect(page.getByTestId('profile-email-link-row')).toContainText(NEW_EMAIL)
        await expect(page.getByTestId('profile-email-link-unlink')).toBeVisible()
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-4-linked.png`,
          animations: 'disabled',
        })

        await page.getByTestId('profile-email-link-unlink').click()
        const dialog = page.getByTestId('email-link-unlink')
        await expect(dialog).toBeVisible()
        await expect(dialog).toContainText('Отвязать почту?')
        await expect(dialog).toContainText('Входить на сайте по ней больше не получится.')
        await page.getByTestId('email-link-unlink-confirm').click()

        await expect(page.getByTestId('email-link-unlink')).toHaveCount(0)
        await expect(page.getByTestId('profile-email-link-row')).toContainText('Добавить')
      } finally {
        await context.close()
      }
    })

    // 3. Ветка 409 email_in_use: адрес уже занят, письмо не уходит.
    test('занятый адрес: 409 email_in_use', async ({ browser }) => {
      const context = await createContext(browser, viewport)
      const page = await context.newPage()

      try {
        await page.goto('/?demo=1')
        await openProfileData(page)
        await openEmailLinkScreen(page)

        await page.getByTestId('email-link-email-field').fill(TAKEN_EMAIL)
        await page.getByTestId('email-link-request-code').click()

        await expect(page.getByTestId('email-link-error')).toContainText(
          'Эта почта уже используется. Укажи другую.'
        )
        // Шага с кодом нет: письмо не отправлено.
        await expect(page.getByTestId('email-link-code-field')).toHaveCount(0)
        await page.screenshot({
          path: `${SHOTS}/${viewport.name}-5-in-use.png`,
          animations: 'disabled',
        })
      } finally {
        await context.close()
      }
    })
  })
}

// 4. Неверный код — ответ 200 с ok: false, экран остаётся на шаге кода.
test('неверный код: «Код не подошёл. Проверь письмо.»', async ({ browser }) => {
  const context = await createContext(browser, VIEWPORTS[0])
  const page = await context.newPage()

  try {
    await page.goto('/?demo=1')
    await openProfileData(page)
    await openEmailLinkScreen(page)

    await page.getByTestId('email-link-email-field').fill(NEW_EMAIL)
    await page.getByTestId('email-link-request-code').click()
    await page.getByTestId('email-link-code-field').fill('000000')
    await page.getByTestId('email-link-verify').click()

    await expect(page.getByTestId('email-link-error')).toContainText(
      'Код не подошёл. Проверь письмо.'
    )
    await expect(page.getByTestId('email-link-code-field')).toBeVisible()
  } finally {
    await context.close()
  }
})
