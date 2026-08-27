import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const settings = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const notice = await readFile(
  new URL('../../src/screens/PrivacyNotice.jsx', import.meta.url),
  'utf8'
)
const noticeText = notice.replace(/\s+/g, ' ')

test('Settings exposes the privacy and data disclosure to Telegram and web users', () => {
  assert.equal((settings.match(/title="Политика и данные"/g) || []).length, 2)
  assert.match(settings, /setScreen\('privacy-notice'\)/)
  assert.match(settings, /<PrivacyNotice onBack=\{\(\) => setScreen\(null\)\} \/>/)
})

test('privacy notice describes retention and deletion boundaries without a false timing promise', () => {
  assert.match(noticeText, /Автоматический срок удаления сохранённых серверных данных сейчас не настроен/)
  assert.match(noticeText, /подтверждённое удаление аккаунта с owner-scoped данными/)
  assert.match(noticeText, /не обещает мгновенную очистку технических резервных копий/)
  assert.doesNotMatch(noticeText, /удаляются автоматически через \d+/)
})

test('privacy notice distinguishes local drafts and lock from cloud backup or encryption', () => {
  assert.match(noticeText, /local draft, а не cloud backup/)
  assert.match(noticeText, /не шифруют серверные данные/)
  assert.match(noticeText, /не заявляем end-to-end encryption/)
})

test('privacy notice does not promise unimplemented iCloud, queue or conflict handling', () => {
  assert.match(noticeText, /Mini App не использует iCloud/)
  assert.match(noticeText, /Offline queue, conflict resolution и правило[\s\S]*last-write-wins не реализованы и не обещаются/)
  assert.match(noticeText, /не редактируй одну и ту же запись\s+параллельно/)
})

test('privacy notice preserves verified Telegram-only sensitive action boundary', () => {
  assert.match(noticeText, /требуют положительного Telegram ID и проверенной\s+Telegram-подписи/)
  assert.match(noticeText, /server-side сессия владельца для таких\s+действий пока не реализована/)
})
