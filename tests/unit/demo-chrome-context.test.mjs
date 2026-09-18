import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldRenderDemoTelegramChrome } from '../../src/lib/demoChrome.js'

const browserWindow = {
  matchMedia: () => ({ matches: false }),
  navigator: { standalone: false },
}

const standaloneWindow = {
  matchMedia: query => ({ matches: query === '(display-mode: standalone)' }),
  navigator: { standalone: false },
}

test('обычный Safari без preview-параметра не показывает chrome-кнопки', () => {
  assert.equal(
    shouldRenderDemoTelegramChrome({
      previewDemoMode: false,
      platformName: 'web',
      windowLike: browserWindow,
    }),
    false
  )
})

test('standalone PWA скрывает кастомные кнопки chrome', () => {
  assert.equal(
    shouldRenderDemoTelegramChrome({
      previewDemoMode: true,
      platformName: 'web',
      windowLike: standaloneWindow,
    }),
    false
  )
})

test('Telegram-контекст скрывает кастомные кнопки chrome', () => {
  assert.equal(
    shouldRenderDemoTelegramChrome({
      previewDemoMode: true,
      platformName: 'telegram',
      windowLike: browserWindow,
    }),
    false
  )
})
