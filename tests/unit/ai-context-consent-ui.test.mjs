import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

/*
 * Issue #1169 — «Доступ ИИ к записям»: карточка в «Диалоге» и переключатель
 * в Профиле. Проверки держат три решения задачи, которые легко потерять при
 * правках: одна поверхность согласия, только Telegram, «Не сейчас» на 7 дней.
 */

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

const libSource = await read('src/lib/aiContextConsent.js')
const cardSource = await read('src/screens/mentalix/AiContextConsentCard.jsx')
const mentalixSource = await read('src/screens/Mentalix.jsx')
const settingsSource = await read('src/screens/Settings.jsx')
const rowSource = await read('src/screens/settings/AiConsentSwitchRow.jsx')
const daimonSource = await read('src/screens/Daimon/DaimonFlow.jsx')

test('согласием управляет только Telegram и настоящий пользователь', () => {
  assert.match(libSource, /platformName === 'telegram' && Number\(user\?\.id\) > 0/)
  assert.match(cardSource, /canManageAiContext\(user\)/)
  assert.match(rowSource, /canManageAiContext\(user\)/)
})

test('карточка стоит в начале разговора трёх ролей и молчит после кризиса и в Даймоне', () => {
  assert.match(libSource, /AI_CONTEXT_PERSONAS = \['mayak', 'kompas', 'dnevnik'\]/)
  assert.match(mentalixSource, /<AiContextConsentCard user=\{user\} persona=\{persona\}/)
  assert.match(mentalixSource, /messages\.some\(message => message\.crisis\)/)
  assert.doesNotMatch(daimonSource, /AiContextConsentCard/)
})

test('«Разрешить» включает согласие и отмечает сегодняшний чек-ин, если он есть', () => {
  assert.match(cardSource, /setContextConsent\(userId, true\)/)
  assert.match(cardSource, /api\.checkin\.today\(userId\)/)
  assert.match(cardSource, /if \(today\?\.id\)/)
  assert.match(cardSource, /setCheckinContext\(userId, today\.id, true\)/)
  assert.match(cardSource, /setConsent\('on'\)/)
})

test('«Не сейчас» прячет карточку на 7 дней через useSynced', () => {
  assert.match(libSource, /AI_CONSENT_SNOOZE_DAYS = 7/)
  assert.match(libSource, /AI_CONSENT_SNOOZE_DAYS \* 24 \* 60 \* 60 \* 1000/)
  assert.match(cardSource, /useSynced\(aiConsentSnoozeKey\(userId\), '0'\)/)
  assert.match(cardSource, /setSnoozedAt\(String\(Date\.now\(\)\)\)/)
  assert.match(cardSource, /isAiConsentSnoozed\(snoozedAt\)/)
  assert.match(cardSource, />\s*Не сейчас\s*</)
})

test('Профиль: группа «Приватность» с одним переключателем, второго переключателя нет', async () => {
  assert.match(settingsSource, /<ProfileGroup label="Приватность">/)
  assert.match(settingsSource, /<AiConsentSwitchRow user=\{user\} \/>/)
  assert.match(rowSource, /AI_CONSENT_TITLE/)
  assert.match(rowSource, /testId="profile-ai-consent-toggle"/)
  assert.match(rowSource, /setContextConsent\(userId, next\)/)
  // Прежняя панель согласия удалена: два разных переключателя запрещены.
  await assert.rejects(read('src/screens/mentalix/AiPrivacyControls.jsx'))
})

test('переключатель профиля отражает состояние сервера, а не догадку', () => {
  assert.match(rowSource, /api\.mentalix\s*\.contextConsent\(userId\)/)
  assert.match(rowSource, /readAiConsentEnabled\(payload\)/)
  assert.match(libSource, /payload\.context_consent === true/)
})
