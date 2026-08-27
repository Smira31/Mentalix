import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const historySource = await readFile(new URL('../../src/screens/History.jsx', import.meta.url), 'utf8')
const controlsSource = await readFile(
  new URL('../../src/screens/mentalix/AiPrivacyControls.jsx', import.meta.url),
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

test('AI privacy panel объясняет, что global consent не открывает все journal entries', () => {
  assert.match(controlsSource, /Глобальное согласие не открывает AI все записи/)
  assert.match(controlsSource, /отметь конкретные\s+check-in/)
  assert.match(controlsSource, /entry_selection_window_days/)
  assert.match(controlsSource, /выбор записей для контекста удалены/)
})
