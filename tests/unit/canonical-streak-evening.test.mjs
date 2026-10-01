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

test('Evening: серверная серия — единственный источник текста серии', () => {
  assert.match(submit, /readCanonicalCurrentStreak\(response\)/)
  assert.match(submit, /if \(currentStreak != null\) setCanonicalEveningStreak\(currentStreak\)/)
  assert.match(completion, /isEvening && canonicalEveningStreak > 0/)
  assert.match(completion, /\{canonicalEveningStreak\}-дневная серия/)
  assert.equal(readCanonicalCurrentStreak({ current_streak: 7 }), 7)
})

test('Evening: ноль валиден; при loading, ошибке или malformed текст серии не показывается', () => {
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
  // Legacy-расчёт по истории удалён: сбой canonical не подменяется числом.
  assert.doesNotMatch(core, /currentCheckinStreak/)
  assert.doesNotMatch(completion, /canonicalEveningStreak \?\? streak/)
  assert.match(submit, /historyResult\.status === 'rejected'/)
  assert.match(submit, /streakResult\.status === 'rejected'/)
})

test('Evening: completion copy, feedback, Scout и surprise остаются прежними', () => {
  assert.match(completion, /<CheckInCompletion\s+evening=\{isEvening\}/)
  assert.match(completion, /onFeedback=\{label =>/)
  assert.match(completion, /sendCheckinFeedback\(/)
  assert.match(completion, /data-testid="surprise-insight"/)
  assert.match(core, /maybeBuildSurprise\(user\)/)
  assert.doesNotMatch(core, /'checkin-open-scout'/, 'scout кнопка убрана с вечернего завершения')
  assert.match(core, /\{ text: 'Сохранить и выйти', run: exitCompletion \}/)
  assert.match(core, /testId: isEvening \? 'checkin-back-to-today' : 'checkin-complete'/)
})
