import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { readCanonicalCurrentStreak } from '../../src/lib/canonicalStreak.js'

const source = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const core = source.slice(
  source.indexOf('function CheckInCore'),
  source.indexOf('function CheckIn({')
)
const submit = core.slice(
  core.indexOf('async function submit'),
  core.indexOf('useEffect(() => {\n    if (!isEvening || step !== doneStep')
)
const completion = core.slice(
  core.indexOf('if (step >= doneStep)'),
  core.indexOf('const moodLevel =')
)

test('Evening: canonical GET вызывается после успешного сохранения, только в ветке completion', () => {
  assert.match(submit, /const savedCheckin = await selectedSaveApi\(user\.id, corePayload\)/)
  assert.match(submit, /if \(isEvening && !savedCheckin\?\.review_completed_at\) \{\s*throw/)
  assert.match(submit, /if \(recovery\) \{[\s\S]*?onDone\(\)\s*return/)
  const evening = submit.slice(submit.lastIndexOf('setStep(doneStep)'))
  assert.match(evening, /api\.streak\(user\.id\)/)
  assert.match(evening, /api\.checkin\.history\(user\.id, 90\)/)
  assert.match(evening, /Promise\.allSettled\(\[/)
})

test('Evening: canonical current_streak главнее истории, даже если history ответит позже', () => {
  assert.match(submit, /readCanonicalCurrentStreak\(response\)/)
  assert.match(submit, /if \(currentStreak != null\) setCanonicalEveningStreak\(currentStreak\)/)
  assert.match(completion, /isEvening && \(canonicalEveningStreak \?\? streak\) > 0/)
  assert.match(completion, /\{canonicalEveningStreak \?\? streak\}-дневная серия/)
  assert.equal(readCanonicalCurrentStreak({ current_streak: 7 }), 7)
})

test('Evening: ноль валиден; при loading, ошибке или malformed остаётся legacy fallback', () => {
  assert.equal(readCanonicalCurrentStreak({ current_streak: 0 }), 0)
  for (const response of [
    null,
    {},
    { current_streak: -1 },
    { current_streak: '5' },
    { current_streak: 1.5 },
  ]) {
    assert.equal(readCanonicalCurrentStreak(response), null)
  }
  assert.match(core, /useState\(null\)/)
  assert.match(submit, /setStreak\(Math\.max\(1, currentCheckinStreak\(entries\)\)\)/)
  assert.match(submit, /historyResult\.status === 'rejected'/)
  assert.match(submit, /streakResult\.status === 'rejected'/)
  assert.match(completion, /canonicalEveningStreak \?\? streak/)
})

test('Evening: completion copy, feedback, Scout и surprise остаются прежними', () => {
  assert.match(completion, /isEvening \? 'Чек-ин завершён' : 'Готово\.'/)
  assert.match(completion, /Было полезно\?/)
  assert.match(completion, /sendCheckinFeedback\(/)
  assert.match(completion, /data-testid="surprise-insight"/)
  assert.match(core, /maybeBuildSurprise\(user\)/)
  assert.match(core, /'checkin-open-scout'/)
  assert.match(core, /\{ text: 'Вернуться в Сегодня', run: onDone \}/)
  assert.match(core, /testId: isEvening \? 'checkin-back-to-today' : 'checkin-complete'/)
})
