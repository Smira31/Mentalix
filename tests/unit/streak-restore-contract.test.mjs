import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const ritualsSource = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const ascezasSource = await readFile(new URL('../../src/screens/Ascezas.jsx', import.meta.url), 'utf8')
const flowSource = await readFile(
  new URL('../../src/components/practices/PracticeListFlow.jsx', import.meta.url),
  'utf8'
)
const detailSource = await readFile(
  new URL('../../src/components/PracticeDetail.jsx', import.meta.url),
  'utf8'
)
const wordingSource = await readFile(
  new URL('../../src/lib/practiceWording.js', import.meta.url),
  'utf8'
)
const sheetSource = await readFile(
  new URL('../../src/components/StreakRestoreSheet.jsx', import.meta.url),
  'utf8'
)

const api = apiSource.replace(/\s+/g, ' ')

test('обычные отметки не передают restore-поле, а восстановление передаёт только относительное смещение', () => {
  assert.match(api, /log: \(ritualId, userId, level, restoreDaysAgo = null\)/)
  assert.match(api, /log: \(ascezaId, userId, status, breakTrigger = null, breakNote = null, restoreDaysAgo = null\)/)
  assert.match(api, /restoreDaysAgo === null \? \{\} : \{ restore_days_ago: restoreDaysAgo \}/)
})

test('восстановление дня вернулось тихой ссылкой на экране практики', () => {
  // Лист открывает общий каркас; сами экраны практик его не импортируют.
  assert.match(flowSource, /import StreakRestoreSheet from '..\/StreakRestoreSheet'/)
  assert.match(flowSource, /restoreChoicesFor/)
  assert.match(ritualsSource, /restoreRitual/)
  assert.match(ascezasSource, /restoreAsceza/)

  // Ссылка «Отметить вчера» живёт под карточкой недели.
  assert.match(detailSource, /data-testid="practice-restore-yesterday"/)
  assert.match(wordingSource, /RESTORE_LINK_LABEL = 'Отметить вчера'/)
  assert.match(
    detailSource,
    /data-testid="practice-detail-week"[\s\S]*data-testid="practice-restore-yesterday"/
  )

  // Восстановленный вчерашний день не отмечает сегодняшний.
  assert.match(ritualsSource, /restoreDaysAgo === null/)
  assert.match(ascezasSource, /restoreDaysAgo === null/)
})

test('возвращённые практики не тянут StreakBar с freezes', () => {
  assert.doesNotMatch(flowSource, /StreakBar|freezes/)
  assert.doesNotMatch(ritualsSource, /StreakBar|freezes/)
  assert.doesNotMatch(ascezasSource, /StreakBar|freezes/)
})

test('restore-sheet ограничивает выбор семью прошедшими днями и требует явного подтверждения', () => {
  assert.match(sheetSource, /const RESTORE_DAY_OPTIONS = \[1, 2, 3, 4, 5, 6, 7\]/)
  assert.match(sheetSource, /Будущие даты и сегодняшняя\s+отметка не меняются/)
  assert.match(sheetSource, /disabled=\{!restoreDaysAgo \|\| !choice \|\| saving\}/)
  assert.match(sheetSource, /Подтвердить восстановление/)
})
