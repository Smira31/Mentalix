// PAY-UI-001: экран «Подписка» в каждом demo payState показывает ожидаемый
// заголовок и кнопку/плашку.
// Нужен флаг VITE_PAYMENT_UI_ENABLED=true, поэтому набор запускается своим
// dev-сервером: `npm run ux:payment-ui` (playwright.payment-ui.config.mjs).
// В песочнице флаг задан docker-compose.base44.yml.
// Web-контекст (не Telegram): base/expired показывают плашку, а не кнопку оплаты.

import { expect, test } from '@playwright/test'
import { openWeb } from './profile-helpers.mjs'

const VIEWPORT = { width: 390, height: 844 }

const CASES = [
  { payState: 'guest', title: 'Сначала сохрани прогресс по email', testId: 'subscription-save-progress' },
  { payState: 'base', title: 'Готов открыть свой потенциал?', testId: 'subscription-web-note' },
  { payState: 'pro', title: 'Pro активен', testId: null },
  { payState: 'expired', title: 'Срок Pro закончился', testId: 'subscription-web-note' },
  { payState: 'pending', title: 'Оплата обрабатывается', testId: 'subscription-check-payment' },
]

for (const { payState, title, testId } of CASES) {
  test(`экран «Подписка» — payState=${payState}`, async ({ browser, baseURL }) => {
    const { context, page } = await openWeb(browser, baseURL, VIEWPORT)
    try {
      await page.goto(`/?demo=1&payState=${payState}`)
      await expect(page.getByTestId('today-profile-button')).toBeVisible()
      await page.getByTestId('today-profile-button').click()
      await page.getByTestId('profile-screen').getByText('Подписка').click()
      await expect(page.getByTestId('profile-screen-subscription')).toBeVisible()
      await expect(page.getByText(title)).toBeVisible()
      if (testId) {
        await expect(page.getByTestId(testId)).toBeVisible()
      } else {
        // pro — кнопки оплаты нет
        await expect(page.getByTestId('subscription-pay-button')).not.toBeVisible()
      }
    } finally {
      await context.close()
    }
  })
}
