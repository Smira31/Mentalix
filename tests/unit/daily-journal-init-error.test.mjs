import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * Регрессия: при сбое начальной загрузки setup/entries (сетевая ошибка,
 * 5xx) DailyJournalFlow молча переходил к пустому потоку ('stream') или
 * локальному fallback-черновику. Пользователь не понимал, что данные
 * не загрузились — видел пустой экран «Выпиши всё из головы» без целей,
 * напоминаний и вопросов.
 *
 * Требуется:
 *  - понятный error-state при сбое загрузки без локального черновика;
 *  - кнопка «Повторить», перезапускающая начальную загрузку;
 *  - offline-first и локальные черновики не ломаются.
 */

const source = await readFile(
  new URL('../../src/screens/DailyJournal/DailyJournalFlow.jsx', import.meta.url),
  'utf8'
)

test('при сбое загрузки без черновика показывается error-state, а не пустой поток', () => {
  // Находим catch-блок init по маркеру «init failed» и берём код после него
  const initFailedPos = source.indexOf("init failed")
  assert.ok(initFailedPos > 0, 'маркер init failed найден в исходнике')
  // Код от маркера до конца catch-блока (закрывающая скобка на отступе)
  const afterMarker = source.slice(initFailedPos)
  // else-ветвь без черновика должна вести на 'error', не на 'stream'
  assert.match(
    afterMarker,
    /else\s*\{[\s\S]*?setStage\('error'\)/,
    'при отсутствии черновика и ошибке загрузки stage должен быть error, не stream'
  )
  // Не должно быть setStage('stream') в этом catch-блоке
  const catchEnd = afterMarker.indexOf('\n    }')
  const catchBody = afterMarker.slice(0, catchEnd > 0 ? catchEnd : 500)
  assert.doesNotMatch(
    catchBody,
    /setStage\('stream'\)/,
    'catch-блок init не должен переходить на пустой поток (stream)'
  )
})

test('error-state рендерится с data-testid и понятным сообщением', () => {
  assert.match(source, /data-testid="dj-init-error"/, 'data-testid экрана ошибки присутствует')
  assert.match(
    source,
    /role="alert"/,
    'error-state должен иметь role="alert" для доступности'
  )
  // Понятное сообщение пользователю
  assert.match(
    source,
    /Не удалось загрузить|Не получилось загрузить|данные не загрузились/i,
    'error-state должен содержать понятное сообщение об ошибке загрузки'
  )
})

test('кнопка «Повторить» присутствует с data-testid', () => {
  assert.match(source, /data-testid="dj-init-retry"/, 'data-testid кнопки повтора присутствует')
  assert.match(source, /Повторить/, 'кнопка повтора содержит текст «Повторить»')
})

test('повтор перезапускает начальную загрузку, а не просто меняет stage', () => {
  // Должен быть механизм, который заставляет init useEffect сработать заново:
  // либо retry-счётчик в зависимостях init-эффекта, либо явный повторный вызов.
  assert.match(
    source,
    /retryKey|retryCount|initRetry|setRetryKey|setRetryCount/,
    'должен быть retry-триггер (retryKey/retryCount) для перезапуска init'
  )

  // Init useEffect должен зависеть от этого триггера
  const initEffectMatch = source.match(
    /useEffect\(\(\)\s*=>\s*\{[\s\S]*?async function init[\s\S]*?\},\s*\[([^\]]+)\]/
  )
  assert.ok(initEffectMatch, 'init useEffect найден')
  const deps = initEffectMatch[1]
  assert.match(
    deps,
    /retryKey|retryCount|initRetry/,
    'init useEffect должен зависеть от retry-триггера, чтобы повтор запускал загрузку заново'
  )
})

test('offline-first и локальные черновики не сломаны', () => {
  // При наличии черновика и ошибке загрузки — fallback на черновик сохранён
  const initFailedPos = source.indexOf("init failed")
  assert.ok(initFailedPos > 0, 'маркер init failed найден в исходнике')
  const afterMarker = source.slice(initFailedPos)
  const catchEnd = afterMarker.indexOf('\n    }')
  const catchBody = afterMarker.slice(0, catchEnd > 0 ? catchEnd : 500)

  assert.match(
    catchBody,
    /readDailyJournalDraft/,
    'catch-блок должен проверять локальный черновик (offline-first)'
  )
  assert.match(
    catchBody,
    /d\?\.streamText\s*\|\|\s*d\?\.promptAnswer/,
    'fallback на черновик должен сохраняться при наличии локальных данных'
  )
  assert.match(
    catchBody,
    /setStage\('today'\)/,
    'при наличии черновика stage должен оставаться today (offline-first fallback)'
  )
})
