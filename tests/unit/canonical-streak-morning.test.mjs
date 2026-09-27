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
 * Canonical streak (GET /api/streak?user_id=<id>, backend PR #108):
 * Morning Check-in completion берёт число серии из canonical current_streak,
 * legacy history-расчёт остаётся только fallback (loading/error/invalid).
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

test('Morning completion: canonical current_streak — primary source', () => {
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
  // canonical применяется после legacy-расчёта и главнее него.
  const legacyIndex = finishBlock.indexOf('setStreak(Math.max(1, currentCheckinStreak(history)))')
  const canonicalIndex = finishBlock.indexOf('setStreak(currentStreak)')
  assert.ok(legacyIndex > -1, 'legacy-расчёт сохранён')
  assert.ok(canonicalIndex > legacyIndex, 'canonical применяется поверх legacy')
})

test('Morning completion: streak=0 — валидное canonical-значение, не fallback', () => {
  // readCanonicalCurrentStreak принимает только безопасное целое >= 0:
  // нулевая серия — законный canonical-ответ и не должна подменяться legacy.
  assert.match(canonicalSource, /Number\.isSafeInteger\(value\) && value >= 0 \? value : null/)
  // На completion-экране streak показывается только при > 0 (product contract).
  assert.match(morningFlow, /\{streak > 0 \?/)
})

test('Morning completion: fallback работает при error/loading/invalid canonical', () => {
  // Legacy history-расчёт остаётся и применяется без canonical.
  assert.match(
    finishBlock,
    /setStreak\(Math\.max\(1, currentCheckinStreak\(history\)\)\)/,
    'fallback-значение из истории'
  )
  // Canonical применяется только при fulfilled и валидном ответе:
  // loading (не пришёл), network error (rejected) и malformed
  // (readCanonicalCurrentStreak → null) оставляют legacy-значение.
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
  assert.match(finishBlock, /saveApi\(user\.id, morningPayload\)/)
  assert.match(finishBlock, /mood: values\.mood \|\| 3/)
  assert.match(finishBlock, /energy: values\.energy \|\| 3/)
  // redo завершается без completion-экрана — canonical там не нужен.
  assert.match(finishBlock, /if \(redo\) \{\s*onDone\(\)\s*return\s*\}/)
})

test('Morning completion contract не регрессирует', () => {
  assert.match(morningFlow, /<h1>Чек-ин завершён<\/h1>/, 'заголовок «Чек-ин завершён»')
  assert.match(morningFlow, /data-testid="checkin-streak"/)
  assert.match(morningFlow, /дневная серия/)
  assert.match(
    morningFlow,
    /\{ text: 'Вернуться в Сегодня', testId: 'checkin-back-to-today', onClick: onDone \}/,
    'CTA «Вернуться в Сегодня»'
  )
  assert.doesNotMatch(morningFlow, /Было полезно\?/, 'для Morning feedback не добавляется')
})
