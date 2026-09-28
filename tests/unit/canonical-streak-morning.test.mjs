import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(
  new URL('../../src/screens/CheckIn.jsx', import.meta.url),
  'utf8'
)
const canonicalSource = await readFile(
  new URL('../../src/lib/canonicalStreak.js', import.meta.url),
  'utf8'
)

/*
 * Мягкая серия (GET /api/streak?user_id=<id>): утреннее завершение берёт
 * число серии только с сервера. Клиентский расчёт по истории удалён —
 * сервер владеет календарной границей и правилом заморозки.
 */

const morningFlow = checkinSource.slice(
  checkinSource.indexOf('function MorningCheckInFlow'),
  checkinSource.indexOf('// ── Чек-ин и вечерний')
)

const finishBlock = morningFlow.slice(
  morningFlow.indexOf('async function finish'),
  morningFlow.indexOf('const action =')
)

test('Morning completion: после успешного чек-ина запрашивается canonical streak', () => {
  // Обновление canonical сразу после завершения: тот же шаг finish(),
  // что и раньше показывает completion-экран.
  assert.match(
    finishBlock,
    /Promise\.allSettled\(\[\s*api\.checkin\.history\(user\.id, 90\),\s*api\.streak\(user\.id\),\s*\]\)/,
    'finish() параллельно запрашивает историю и GET /api/streak'
  )
  assert.match(
    checkinSource,
    /import \{ readCanonicalCurrentStreak \} from '\.\.\/lib\/canonicalStreak'/,
    'хелпер canonical-контракта импортируется из общего модуля'
  )
})

test('Morning completion: серверная серия — единственный источник числа', () => {
  assert.match(
    finishBlock,
    /const currentStreak = readCanonicalCurrentStreak\(streakResult\.value\)/,
    'значение читается из canonical-ответа'
  )
  assert.match(
    finishBlock,
    /if \(currentStreak != null\) \{\s*setStreak\(currentStreak\)/,
    'валидный canonical перезаписывает streak'
  )
  // Клиентский расчёт серии по истории удалён вместе с soft-streak миграцией.
  assert.doesNotMatch(
    morningFlow,
    /currentCheckinStreak/,
    'legacy-расчёт серии из истории удалён'
  )
})

test('Morning completion: streak=0 — валидное canonical-значение, не fallback', () => {
  // readCanonicalCurrentStreak принимает только безопасное целое >= 0:
  // нулевая серия — законный canonical-ответ и не должна подменяться legacy.
  assert.match(canonicalSource, /Number\.isSafeInteger\(value\) && value >= 0 \? value : null/)
  // На completion-экране streak показывается только при > 0 (product contract).
  assert.match(morningFlow, /\{streak > 0 &&/)
})

test('Morning completion: сбой canonical не ломает завершение', () => {
  // Сервер — единственный источник: при error/loading/invalid canonical
  // число серии просто не показывается (streak остаётся 0), без расчёта по истории.
  assert.doesNotMatch(
    morningFlow,
    /currentCheckinStreak/,
    'fallback-расчёт из истории не возвращается'
  )
  // Canonical применяется только при fulfilled и валидном ответе.
  assert.match(finishBlock, /if \(streakResult\.status === 'fulfilled'\)/)
  assert.match(finishBlock, /if \(currentStreak != null\)/)
  // Сбой canonical не ломает завершение: allSettled, ветка else только логирует.
  assert.match(
    finishBlock,
    /\} else \{\s*console\.error\(streakResult\.reason\)\s*\}/
  )
  // Сбой истории не мешает canonical-значению (обе ветки независимы).
  assert.match(finishBlock, /if \(historyResult\.status === 'fulfilled'\)/)
})

test('Morning completion: persistence/payload не изменились', () => {
  assert.match(finishBlock, /const saveApi = redo \? api\.checkin\.redo : api\.checkin\.save/)
  assert.match(finishBlock, /redo \? \{ \.\.\.morningResetPayload\(existing\), \.\.\.morningPayload \} : morningPayload/)
  assert.match(finishBlock, /mood: values\.mood \|\| 3/)
  assert.match(finishBlock, /energy: values\.energy \|\| 3/)
  // При повторе canonical читается, но не увеличивается повторным PUT.
  assert.match(finishBlock, /setStep\(doneStep\)/)
})

test('Morning completion contract не регрессирует', () => {
  assert.match(morningFlow, /<CheckInCompletion[\s\S]*?evening=\{false\}/, 'общий экран утреннего завершения')
  assert.match(morningFlow, /data-testid="checkin-streak"/)
  assert.match(morningFlow, /дневная серия/)
  assert.match(
    morningFlow,
    /\{ text: 'Сохранить и выйти', testId: 'checkin-back-to-today', onClick: onDone \}/,
    'CTA «Сохранить и выйти»'
  )
  assert.match(morningFlow, /sendCheckinFeedback\(api\.checkin\.feedback, savedMorningId, label\)/, 'утро отправляет оценку сохранённой записи')
})
