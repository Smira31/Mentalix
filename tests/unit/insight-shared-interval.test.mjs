import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { insightIntervalElapsed } from '../../src/screens/mentalix/surpriseRules.js'

const surpriseSrc = await readFile(
  new URL('../../src/screens/mentalix/surpriseInsight.js', import.meta.url),
  'utf8'
)
const digestSrc = await readFile(
  new URL('../../src/screens/mentalix/insightDigest.js', import.meta.url),
  'utf8'
)

const today = new Date().toISOString().slice(0, 10)
const dayOffset = count =>
  new Date(Date.parse(`${today}T00:00:00Z`) + count * 86400000).toISOString().slice(0, 10)

test('сюрприз и дайджест читают одну и ту же отметку даты из insightDigest', () => {
  // Оба модуля импортируют readLastInsightDate из ./insightDigest —
  // единственный источник правды о дате последнего показа.
  assert.match(digestSrc, /export async function readLastInsightDate/)
  assert.match(digestSrc, /const INSIGHT_SEEN_KEY = 'mx-insight-seen'/)
  assert.match(surpriseSrc, /import \{ readLastInsightDate[^}]*\} from '\.\/insightDigest'/)
  assert.match(digestSrc, /readLastInsightDate\(\)/)
})

test('сюрприз пишет ту же отметку даты, что и дайджест', () => {
  // maybeBuildSurprise вызывает writeInsightSeen(today) перед возвратом
  // находки — отметка общая с maybeBuildInsightMessage.
  assert.match(surpriseSrc, /import \{[^}]*writeInsightSeen[^}]*\} from '\.\/insightDigest'/)
  assert.match(surpriseSrc, /writeInsightSeen\(today\)/)
  // Дайджест пишет ту же функцию с той же датой.
  assert.match(digestSrc, /export function writeInsightSeen/)
  assert.match(digestSrc, /writeInsightSeen\(todayIso\(\)\)/)
})

test('после показа сюрприза или дайджеста общий интервал молчит 4 дня', () => {
  // Симулируем «записали сегодняшнюю дату» (writeInsightSeen(today)),
  // затем читаем её обратно (readLastInsightDate → today) и проверяем,
  // что insightIntervalElapsed — общий гейт для обоих — держит тишину.
  const lastDate = today // writeInsightSeen(today) → readLastInsightDate() → today

  // Дни 0–3 после показа — интервал не истёк, дайджест и сюрприз молчат.
  for (const offset of [0, 1, 2, 3]) {
    assert.equal(
      insightIntervalElapsed(lastDate, dayOffset(offset)),
      false,
      `день ${offset}: интервал ещё не истёк`
    )
  }

  // На 4-й день интервал истёк — показ снова возможен.
  assert.equal(insightIntervalElapsed(lastDate, dayOffset(4)), true)
})

test('без отметки интервал истёк сразу — первый показ доступен', () => {
  assert.equal(insightIntervalElapsed(null, today), true)
  assert.equal(insightIntervalElapsed(undefined, today), true)
})
