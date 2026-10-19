import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Регрессия #1083 — противоречивые статусы сохранения журнала.
 *
 * Сценарий бага: при нестабильной сети POST записи успевал на сервере,
 * но ответ терялся. Автоповтор (flushPending) находил запись в списке,
 * снимал pendingSave, но не снимал saveError и не проставлял entryId —
 * статус «Не отправлено» висел после успешной отправки. Вместе с ним
 * заголовок финала говорил «Запись сохранена», а баннер — «Не отправлено»:
 * взаимоисключающие статусы на одном экране.
 *
 * Требуется:
 *  - в flushPending ветка «запись уже есть на сервере» снимает saveError
 *    и проставляет entryId найденной записи;
 *  - при saveError на финале заголовок — «Сохранено на устройстве»,
 *    а не «Запись сохранена»;
 *  - статус offline не содержит противоречивого «Не отправлено» рядом
 *    с «сохранена»: запись безопасна на устройстве и уйдёт на сервер.
 */

const source = await readFile(
  new URL('../../src/screens/DailyJournal/DailyJournalFlow.jsx', import.meta.url),
  'utf8'
)

test('flushPending: запись уже на сервере — saveError снят, entryId проставлен', () => {
  // Тело flushPending — от объявления до зависимостей useCallback
  const start = source.indexOf('const flushPending = useCallback')
  assert.ok(start > 0, 'flushPending найден в исходнике')
  const end = source.indexOf('}, [userId, postEntry])', start)
  assert.ok(end > start, 'конец flushPending найден')
  const body = source.slice(start, end)

  // Ветка обнаружения существующей записи на сервере
  const branchMatch = body.match(
    /const existing = entries\.items\?\.find\(e => e\.date === date\)([\s\S]*?)\n      \}/
  )
  assert.ok(branchMatch, 'ветка «запись уже есть на сервере» находит entry')
  const branch = branchMatch[1]
  assert.match(
    branch,
    /setSaveError\(false\)/,
    'снимает saveError, иначе «Не отправлено» висит после успешной отправки'
  )
  assert.match(
    branch,
    /setEntryId\(existing\.id\)/,
    'проставляет entryId найденной записи'
  )
  assert.match(
    branch,
    /setHasTodayEntry\(true\)/,
    'помечает запись сохранённой на сегодня'
  )
})

test('финал при saveError: заголовок «Сохранено на устройстве», не «Запись сохранена»', () => {
  // Заголовок CheckInCompletion на финале журнала
  const completePos = source.indexOf('<CheckInCompletion')
  assert.ok(completePos > 0, 'экран финала найден')
  const titlePos = source.indexOf('title={', completePos)
  assert.ok(titlePos > completePos, 'проп title финала найден')
  const titleBody = source.slice(titlePos, source.indexOf('datePill=', titlePos))

  assert.match(
    titleBody,
    /saveError\s*\?/,
    'заголовок финала зависит от saveError'
  )
  assert.match(
    titleBody,
    /Сохранено/,
    'при saveError заголовок — «Сохранено на устройстве»'
  )
  assert.match(
    titleBody,
    /на устройстве/,
    'уточнение «на устройстве» отличает локальное сохранение от отправки'
  )
})

test('offline-статус без противоречия: «Сохранено на устройстве» + обещание отправки', () => {
  // Заголовок экрана «Запись сегодня» при неотправленной записи
  const todayTitleMatch = source.match(/saveError && !entryId \? '([^']+)' : 'Запись сохранена'/)
  assert.ok(
    todayTitleMatch,
    'заголовок «Запись сегодня» зависит от saveError && !entryId'
  )
  assert.equal(
    todayTitleMatch[1],
    'Сохранено на устройстве',
    'при неотправленной записи заголовок не пугает «не отправлена»'
  )

  // Баннеры статуса объясняют, что запись в безопасности и уйдёт на сервер
  assert.match(
    source,
    /data-testid="dj-today-unsent"[\s\S]*?Отправим на сервер, когда появится связь[\s\S]*?запись не потеряется/,
    'баннер «Запись сегодня» обещает отправку и сохранность записи'
  )
  assert.match(
    source,
    /data-testid="dj-save-error"[\s\S]*?Отправим на сервер, когда появится связь[\s\S]*?запись не потеряется/,
    'баннер финала обещает отправку и сохранность записи'
  )

  // Противоречивое «Не отправлено — отправим…» больше не показывается
  assert.doesNotMatch(
    source,
    /Не отправлено — отправим/,
    'текст «Не отправлено» рядом с «сохранена» удалён из журнала'
  )
})
