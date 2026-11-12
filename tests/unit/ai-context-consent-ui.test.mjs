import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * Приватность — «Доступ ИИ к записям». Проверки держат решения задачи,
 * которые легко потерять при правках: одна поверхность согласия — Профиль,
 * только Telegram, в «Диалоге» о доступе ничего нет, включение — только
 * через окно согласия.
 */

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const libSource = await read('src/lib/aiContextConsent.js')
const mentalixSource = await read('src/screens/Mentalix.jsx')
const appSource = await read('src/App.jsx')
const settingsSource = await read('src/screens/Settings.jsx')
const rowSource = await read('src/screens/settings/AiConsentSwitchRow.jsx')
const daimonSource = await read('src/screens/Daimon/DaimonFlow.jsx')

test('согласием управляет только Telegram и настоящий пользователь', () => {
  assert.match(libSource, /platformName === 'telegram' && Number\(user\?\.id\) > 0/)
  assert.match(rowSource, /canManageAiContext\(user\)/)
})

test('в «Диалоге» о доступе ничего: ни карточки, ни строки, ни значка', async () => {
  // Решение владельца: единственная поверхность согласия — Профиль.
  await assert.rejects(read('src/screens/mentalix/AiContextConsentCard.jsx'))
  await assert.rejects(read('src/screens/mentalix/AiContextConsentLine.jsx'))
  assert.doesNotMatch(mentalixSource, /AiContextConsent/)
  assert.doesNotMatch(mentalixSource, /onOpenPrivacy/)
  // Проп contextSlot возвращён к исходному виду — «Диалог» ничего не добавляет.
  assert.match(mentalixSource, /contextSlot=\{contextSlot\}/)
  // Даймон согласия не касается: у него своя поверхность.
  assert.doesNotMatch(daimonSource, /AiContextConsent/)
})

test('навигации «из Диалога в Приватность» больше нет', () => {
  assert.doesNotMatch(appSource, /openPrivacySettings/)
  assert.doesNotMatch(appSource, /onOpenPrivacy/)
})

test('текстов строки «Диалога» в источнике текстов не осталось', () => {
  assert.doesNotMatch(libSource, /AI_CONSENT_LINE/)
  assert.doesNotMatch(libSource, /Собеседники не видят твои записи/)
  assert.doesNotMatch(libSource, /Настроить/)
})

test('Профиль: группа «Приватность» с одним переключателем, второго переключателя нет', async () => {
  assert.match(settingsSource, /<ProfileGroup label="Приватность">/)
  assert.match(settingsSource, /<AiConsentSwitchRow user=\{user\} \/>/)
  assert.match(rowSource, /AI_CONSENT_SWITCH_TITLE/)
  assert.match(rowSource, /testId="profile-ai-consent-toggle"/)
  // Прежняя панель согласия удалена: два разных переключателя запрещены.
  await assert.rejects(read('src/screens/mentalix/AiPrivacyControls.jsx'))
})

test('включение только через окно согласия, выключение — сразу', () => {
  // Включение открывает окно и ничего не отправляет.
  assert.match(rowSource, /if \(next\) \{\s*setConfirmOpen\(true\)\s*return\s*\}/)
  assert.match(rowSource, /<ConfirmDialog/)
  assert.match(rowSource, /testId="ai-consent-dialog"/)
  // PUT уходит только из save(): «Включить» после окна или выключение.
  assert.equal(rowSource.match(/setContextConsent\(userId, /g)?.length, 1)
  assert.match(rowSource, /void save\(true\)/)
  assert.match(rowSource, /void save\(false\)/)
  assert.match(rowSource, /onCancel=\{\(\) => setConfirmOpen\(false\)\}/)
})

test('сегодняшний чек-ин при включении не отмечается', () => {
  assert.doesNotMatch(rowSource, /setCheckinContext/)
  assert.doesNotMatch(rowSource, /api\.checkin\.today/)
})

test('переключатель профиля отражает состояние сервера, а не догадку', () => {
  assert.match(rowSource, /api\.mentalix\s*\.contextConsent\(userId\)/)
  assert.match(rowSource, /readAiConsentEnabled\(payload\)/)
  assert.match(libSource, /payload\.context_consent === true/)
})
