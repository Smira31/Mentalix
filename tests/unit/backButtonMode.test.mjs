import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isTelegramBackMode } from '../../src/lib/backButtonMode.js'

test('системная кнопка только при непустом initData Telegram', () => {
  assert.equal(isTelegramBackMode({ initData: 'user=123&hash=abc' }), true)
  assert.equal(isTelegramBackMode({ initData: '' }), false)
  assert.equal(isTelegramBackMode({ initData: '  ' }), false)
  assert.equal(isTelegramBackMode({ BackButton: { show() {} } }), false)
  assert.equal(isTelegramBackMode(null), false)
})
