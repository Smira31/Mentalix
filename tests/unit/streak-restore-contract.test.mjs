import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const ritualsSource = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const ascezasSource = await readFile(new URL('../../src/screens/Ascezas.jsx', import.meta.url), 'utf8')
const sheetSource = await readFile(new URL('../../src/components/StreakRestoreSheet.jsx', import.meta.url), 'utf8')

const api = apiSource.replace(/\s+/g, ' ')

test('обычные отметки не передают restore-поле, а восстановление передаёт только относительное смещение', () => {
  assert.match(api, /log: \(ritualId, userId, level, restoreDaysAgo = null\)/)
  assert.match(api, /log: \(ascezaId, userId, status, breakTrigger = null, breakNote = null, restoreDaysAgo = null\)/)
  assert.match(api, /restoreDaysAgo === null \? \{\} : \{ restore_days_ago: restoreDaysAgo \}/)
})

test('вариант C убирает restore-sheet из UI, сохраняя API-контракт', () => {
  assert.doesNotMatch(ritualsSource, /StreakRestoreSheet|Восстановить пропущенный день|restoreTarget/)
  assert.doesNotMatch(ascezasSource, /StreakRestoreSheet|Восстановить пропущенный день|restoreTarget/)
  assert.match(api, /restoreDaysAgo === null \? \{\} : \{ restore_days_ago: restoreDaysAgo \}/)
})

test('restore-sheet ограничивает выбор семью прошедшими днями и требует явного подтверждения', () => {
  assert.match(sheetSource, /const RESTORE_DAY_OPTIONS = \[1, 2, 3, 4, 5, 6, 7\]/)
  assert.match(sheetSource, /Будущие даты и сегодняшняя\s+отметка не меняются/)
  assert.match(sheetSource, /disabled=\{!restoreDaysAgo \|\| !choice \|\| saving\}/)
  assert.match(sheetSource, /Подтвердить восстановление/)
})
