import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * Приватность — «Доступ ИИ к записям». Проверки держат решения задачи,
 * которые легко потерять при правках: одна поверхность согласия, только
 * Telegram, строка в «Диалоге» без включения и включение в Профиле только
 * через окно согласия.
 */

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const libSource = await read('src/lib/aiContextConsent.js')
const lineSource = await read('src/screens/mentalix/AiContextConsentLine.jsx')
const mentalixSource = await read('src/screens/Mentalix.jsx')
const appSource = await read('src/App.jsx')
const settingsSource = await read('src/screens/Settings.jsx')
const rowSource = await read('src/screens/settings/AiConsentSwitchRow.jsx')
const daimonSource = await read('src/screens/Daimon/DaimonFlow.jsx')

test('согласием управляет только Telegram и настоящий пользователь', () => {
  assert.match(libSource, /platformName === 'telegram' && Number\(user\?\.id\) > 0/)
  assert.match(lineSource, /canManageAiContext\(user\)/)
  assert.match(rowSource, /canManageAiContext\(user\)/)
})

test('строка стоит в начале разговора трёх ролей и молчит после кризиса и в Даймоне', () => {
  assert.match(libSource, /AI_CONTEXT_PERSONAS = \['mayak', 'kompas', 'dnevnik'\]/)
  assert.match(mentalixSource, /<AiContextConsentLine/)
  assert.match(mentalixSource, /hidden=\{hasCrisisReply\}/)
  assert.match(lineSource, /AI_CONTEXT_PERSONAS\.includes\(persona\)/)
  assert.doesNotMatch(daimonSource, /AiContextConsentLine/)
})

test('строка видна только при известном выключенном согласии, без «Не сейчас»', () => {
  // Состояние сервера: 'unknown' — не показываем, 'off' — показываем.
  assert.match(lineSource, /consent === 'off'/)
  assert.match(lineSource, /setConsent\('unknown'\)/)
  assert.match(lineSource, /readAiConsentEnabled\(payload\) \? 'on' : 'off'/)
  // Логика «Не сейчас»/snooze из «Диалога» удалена.
  assert.doesNotMatch(lineSource, /snooze/i)
  assert.doesNotMatch(libSource, /snooze/i)
  assert.doesNotMatch(mentalixSource, /snooze/i)
})

test('«Настроить» ведёт в существующий под-экран Профиля, а не в новый маршрут', () => {
  assert.match(lineSource, /onClick=\{onConfigure\}/)
  assert.match(mentalixSource, /onConfigure=\{onOpenPrivacy\}/)
  assert.match(appSource, /onOpenPrivacy=\{openPrivacySettings\}/)
  assert.match(appSource, /sessionStorage\.setItem\('mx-settings-initial-sub', 'data'\)/)
  assert.match(appSource, /const openPrivacySettings = useCallback\(\(\) => \{[\s\S]*setOverlay\('settings'\)/)
})

test('«Диалог» сам согласие не включает и чек-ин не отмечает', () => {
  assert.doesNotMatch(lineSource, /setContextConsent/)
  assert.doesNotMatch(lineSource, /setCheckinContext/)
  assert.doesNotMatch(lineSource, /api\.checkin\.today/)
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
