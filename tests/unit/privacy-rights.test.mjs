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
  assert.match(apiSource, /eraseAccount: \(userId, otpCode\)/)
  assert.match(apiSource, /confirmation: 'DELETE_MY_DATA'/)
  assert.match(apiSource, /otp_code: otpCode/)
})

test('History удаляет только выбранный check-in после явного confirmation и сохраняет activity', () => {
  assert.match(historySource, /Удалить запись\?/)
  assert.match(historySource, /Это нельзя отменить\./)
  assert.match(historySource, /api\.privacy\.deleteCheckin\(user\.id, checkin\.id\)/)
  assert.match(historySource, /\{ \.\.\.day, checkin: null \}/)
  assert.match(historySource, /Активность ритуалов за этот день сохранена\./)
})

test('Settings не обещают privacy actions для web identity без server-side session', () => {
  assert.match(settingsSource, /privacyProtectedByTelegram = platformName === 'telegram' && Number\(user\?\.id\) > 0/)
  // Гости видят приглашение войти, а не кнопки управления данными
  assert.match(settingsSource, /Сначала войдите в аккаунт, чтобы скачать или удалить свои данные/)
  // Скачивание доступно всем негостям; отправка в Telegram — только в Telegram
  assert.match(settingsSource, /Файл JSON: профиль, чек-ины, записи/)
  assert.match(settingsSource, /Отправить в Telegram/)
  assert.doesNotMatch(settingsSource, /Только данные чек-инов/)
  // Удаление через одноразовый код
  assert.match(settingsSource, /Удалить аккаунт/)
  assert.match(settingsSource, /Потребуется код подтверждения/)
  assert.doesNotMatch(settingsSource, /Удалить все данные сейчас/)
  assert.match(settingsSource, /Незавершённый черновик остаётся\s+только на этом устройстве/)
  assert.match(settingsSource, /а не шифрование данных/)
})
