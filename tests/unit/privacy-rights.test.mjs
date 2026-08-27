import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const historySource = await readFile(new URL('../../src/screens/History.jsx', import.meta.url), 'utf8')
const settingsSource = await readFile(new URL('../../src/screens/Settings.jsx', import.meta.url), 'utf8')

test('privacy delete API всегда передаёт owner id и server-side confirmation', () => {
  assert.match(apiSource, /deleteCheckin: \(userId, checkinId\)/)
  assert.match(apiSource, /\/privacy\/checkins\/\$\{checkinId\}/)
  assert.match(apiSource, /user_id: userId, confirmed: true/)
  assert.match(apiSource, /eraseAccount: userId/)
  assert.match(apiSource, /confirmation: 'DELETE_MY_DATA'/)
})

test('History удаляет только выбранный check-in после явного confirmation и сохраняет activity', () => {
  assert.match(historySource, /Удалить эту сохранённую запись\? Это действие нельзя отменить\./)
  assert.match(historySource, /api\.privacy\.deleteCheckin\(user\.id, checkin\.id\)/)
  assert.match(historySource, /\{ \.\.\.day, checkin: null \}/)
  assert.match(historySource, /Активность ритуалов за этот день сохранена\./)
})

test('Settings не обещают privacy actions для web identity без server-side session', () => {
  assert.match(settingsSource, /privacyProtectedByTelegram = platformName === 'telegram' && Number\(user\?\.id\) > 0/)
  assert.match(settingsSource, /потребуется два подтверждения/)
  assert.match(settingsSource, /В web-версии нет серверной сессии/)
  assert.match(settingsSource, /Незавершённый draft остаётся\s+только на текущем устройстве/)
  assert.match(settingsSource, /а не шифрование данных/)
})
