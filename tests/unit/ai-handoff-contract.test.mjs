import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')

test('evening submit запоминает id сохранённого check-in для AI-handoff', () => {
  assert.match(checkinSource, /setSavedCheckinId\(savedCheckin\?\.id \?\? null\)/)
})

test('openScout — async: сначала проверяет мастер-согласие персонального контекста', () => {
  assert.match(checkinSource, /async function openScout\(\)/)
  assert.match(checkinSource, /api\.mentalix\.contextConsent\(user\.id\)/)
})

test('openScout включает мастер-согласие только после явного подтверждения', () => {
  assert.match(checkinSource, /window\.confirm\(/)
  assert.match(checkinSource, /Следопыт получит доступ к персональному контексту/)
  assert.match(checkinSource, /Передавать можно только записи, отмеченные тобой/)
  assert.match(checkinSource, /api\.mentalix\.setContextConsent\(user\.id, true\)/)
})

test('openScout отмечает только сегодняшнюю запись check-in для AI-контекста', () => {
  assert.match(checkinSource, /const checkinId = savedCheckinId \?\? existing\?\.id/)
  assert.match(checkinSource, /api\.mentalix\.setCheckinContext\(user\.id, checkinId, true\)/)
})

test('per-entry opt-in разрешён только для подтверждённой Telegram-личности', () => {
  assert.match(
    checkinSource,
    /platform\.name === 'telegram' && Number\(user\?\.id\) > 0/
  )
})

test('сбой разрешения не роняет флоу: ошибка видна, переход в чат не происходит', () => {
  assert.match(checkinSource, /Не удалось разрешить разбор дня\. Проверь соединение и попробуй ещё раз\./)
  assert.match(checkinSource, /role="alert"/)
  assert.match(checkinSource, /scoutBusy/)
})

test('хендофф сохраняет прежний переход к Следопыту (dnevnik + разбор дня)', () => {
  assert.match(checkinSource, /MENTOR_PERSONA_KEY, 'dnevnik'/)
  assert.match(checkinSource, /MENTOR_DRAFT_KEY, DAY_REVIEW_PROMPT/)
  assert.match(checkinSource, /url\.searchParams\.set\('tab', 'mentor'\)/)
})
