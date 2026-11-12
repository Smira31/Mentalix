import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const historySource = await readFile(new URL('../../src/screens/History.jsx', import.meta.url), 'utf8')
const rowSource = await readFile(
  new URL('../../src/screens/settings/AiConsentSwitchRow.jsx', import.meta.url),
  'utf8'
)
const consentCopySource = await readFile(
  new URL('../../src/lib/aiContextConsent.js', import.meta.url),
  'utf8'
)

test('per-entry AI API сохраняет enabled только для указанного check-in и user', () => {
  assert.match(apiSource, /setCheckinContext: \(userId, checkinId, enabled\)/)
  assert.match(apiSource, /\/mentalix\/context\/checkins\/\$\{checkinId\}/)
  assert.match(apiSource, /user_id: userId, enabled/)
})

test('History требует Telegram context и явное confirmation до передачи конкретной записи AI', () => {
  assert.match(historySource, /canManageAiContext = platformName === 'telegram' && Number\(user\?\.id\) > 0/)
  assert.match(historySource, /Разрешение AI использовать эту запись/)
  assert.match(historySource, /Разрешить AI использовать текст и метрики этой записи/)
  assert.match(historySource, /Неотмеченные записи ему не передаются/)
  assert.match(historySource, /api\.mentalix\.setCheckinContext\(user\.id, checkin\.id, nextEnabled\)/)
})

test('окно согласия объясняет, какие записи видит собеседник и куда они уходят', () => {
  // #1169: прежняя панель AiPrivacyControls удалена, карточка «Диалога»
  // заменена тихой строкой. Утверждённые владельцем тексты живут в окне
  // согласия в профиле и проверяют три обязательных смысла: отмеченные
  // чек-ины из «Истории», передачу в GigaChat для ответа и выход.
  assert.match(consentCopySource, /которые ты отметишь в «Истории»/)
  assert.match(consentCopySource, /записи передаются туда только для ответа/)
  assert.match(consentCopySource, /Выключить можно в любой момент/)
  assert.match(rowSource, /AI_CONSENT_DIALOG_BODY/)
})
