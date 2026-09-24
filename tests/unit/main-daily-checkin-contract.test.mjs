import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const demoModeSource = await readFile(new URL('../../src/lib/demoMode.js', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')


test('the morning visual flow is the default check-in entry point', () => {
  assert.match(checkinSource, /function MorningCheckInFlow\(\{ user, onDone, redo = false \}\)/)
  assert.match(checkinSource, /if \(mode !== 'evening'\) \{\s*return <MorningCheckInFlow user=\{user\} onDone=\{onDone\} redo=\{redo\} \/>/s)
  assert.doesNotMatch(checkinSource, /if \(previewDemoMode && mode !== 'evening'\)/)
})

test('the legacy core remains available for evening review and rollback', () => {
  assert.match(checkinSource, /function CheckInCore\(\{ user, onDone, mode = 'checkin', existing = null, redo = false \}\)/)
  assert.match(checkinSource, /return <CheckInCore user=\{user\} onDone=\{onDone\} mode=\{mode\} existing=\{existing\} redo=\{redo\} \/>/)
})

test('evening first text step has no pre-declaration question access', () => {
  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  const compactStepDisabled = core.slice(
    core.indexOf('const compactStepDisabled'),
    core.indexOf('const streakDays')
  )
  const eveningQuestionDeclaration = core.indexOf('const eveningQuestion =')
  const firstEveningQuestionUse = core.indexOf('eveningQuestion', eveningQuestionDeclaration + 1)
  const questionTitleDeclaration = core.indexOf('const questionTitle =')
  const firstQuestionTitleUse = core.indexOf('questionTitle', questionTitleDeclaration + 1)

  assert.doesNotMatch(compactStepDisabled, /eveningQuestion/)
  assert.ok(eveningQuestionDeclaration >= 0)
  assert.ok(firstEveningQuestionUse > eveningQuestionDeclaration)
  assert.ok(questionTitleDeclaration >= 0)
  assert.ok(firstQuestionTitleUse > questionTitleDeclaration)
})

test('the default morning flow persists real user data through the check-in API', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /const saveApi = redo \? api\.checkin\.redo : api\.checkin\.save/)
  assert.match(morningFlow, /saveApi\(user\.id, morningPayload\)/)
  assert.match(morningFlow, /mood: values\.mood \|\| 3/)
  assert.match(morningFlow, /energy: values\.energy \|\| 3/)
  assert.match(morningFlow, /note: note\.trim\(\) \|\| undefined/)
  assert.match(morningFlow, /api\.checkin\.history\(user\.id, 90\)/)
  assert.match(apiSource, /checkin: \{[\s\S]*?save: \(/)
  assert.match(apiSource, /request\('\/checkin', \{[\s\S]*?method: 'POST'/)
  assert.match(apiSource, /request\('\/checkin\/today', \{[\s\S]*?method: 'PUT'/)
})

test('morning flow does not send anxiety or focus when the user did not answer them', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  // anxiety and focus are conditionally added, not defaulted to 3
  assert.match(morningFlow, /if \(values\.anxiety != null\) morningPayload\.anxiety = values\.anxiety/)
  assert.match(morningFlow, /if \(values\.focus != null\) morningPayload\.focus = values\.focus/)
  // Must NOT contain unconditional defaults
  assert.doesNotMatch(morningFlow, /anxiety: values\.anxiety \|\| 3/)
  assert.doesNotMatch(morningFlow, /focus: values\.focus \|\| 3/)
})

test('seeded demo state remains opt-in and isolated in the API wrapper', () => {
  assert.match(demoModeSource, /const demoRequested = params\.get\('demo'\) === '1'/)
  assert.match(demoModeSource, /const pwaDemoRequested = params\.get\('source'\) === 'pwa'/)
  assert.match(demoModeSource, /return \(\s*\(demoRequested \|\| pwaDemoRequested\)/s)
  assert.match(apiSource, /if \(isPreviewDemoMode\(\)\) return demoRequest\(path, options\)/)
})

test('morning flow keeps the visual viewport height when the keyboard opens', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /const \{ style: viewportStyle \} = useFullscreenSurface\(\)/)
  assert.match(morningFlow, /const demoSurfaceStyle = \{[\s\S]*\.\.\.viewportStyle[\s\S]*paddingBottom: 0/)
  assert.match(checkinSource, /className="mx-demo-checkin__editor-scene"/)
})

test('morning completion uses design-system SVG art instead of the raster bird', () => {
  assert.match(checkinSource, /function CheckInCompletionArt\(\)/)
  assert.match(checkinSource, /<CheckInCompletionArt \/>/)
  assert.match(checkinSource, /rgb\(var\(--c-(text|gold|muted|bg)\)\)/)
  assert.doesNotMatch(checkinSource, /checkin-bird-reference\.png/)
})

test('morning streak screen uses the shared Telegram BackButton and sprout flower', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /<BackButton onClick=\{handleBack\} label="Сегодня" \/>/)
  assert.match(checkinSource, /function StreakFlower\(\)/)
  assert.match(checkinSource, /stroke="rgb\(var\(--c-gold\)\)"/)
})

test('redo mode calls api.checkin.redo, not api.checkin.save', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /const saveApi = redo \? api\.checkin\.redo : api\.checkin\.save/)

  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  assert.match(core, /const saveApi = redo \? api\.checkin\.redo : api\.checkin\.save/)
})

test('redo mode starts with empty fields — no pre-fill from existing', () => {
  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  assert.match(core, /const fieldSource = redo \? null : existing/)
  assert.match(core, /mood: fieldSource\?\.mood \?\? /)
  assert.match(core, /emotion, setEmotion\] = useState\(fieldSource\?\.emotion \|\| null\)/)
  assert.match(core, /existingLessons\(fieldSource\?\.lessons\)/)
})

test('redo mode skips streak celebration in morning flow', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /if \(redo\) \{[\s\S]*?onDone\(\)[\s\S]*?return[\s\S]*?\}/)
})

test('redo evening review sends review_completed: true via redo API', () => {
  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  assert.match(core, /const saveApi = redo \? api\.checkin\.redo : api\.checkin\.save/)
  assert.match(core, /review_completed: true/)
  assert.match(core, /isEvening && !redo && existing\?\.review_completed_at \? 1 : 0/)
})

test('scale steps never auto-advance — «Далее» is the only way forward', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  const morningPick = morningFlow.slice(
    morningFlow.indexOf('function pick('),
    morningFlow.indexOf('async function finish()')
  )
  assert.doesNotMatch(morningPick, /setStep/, 'утренний pick не должен двигать шаг')
  assert.doesNotMatch(morningPick, /setTimeout/)

  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  const corePick = core.slice(core.indexOf('function pick('), core.indexOf('useEffect('))
  assert.doesNotMatch(corePick, /setStep/, 'pick ядра не должен двигать шаг')
  // нигде в флоу не осталось таймера, который сам переключает шаг шкалы
  assert.doesNotMatch(checkinSource, /setTimeout\(\(\) => \{\s*setStep/)
})

test('morning redo sends PUT without anxiety and focus', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  assert.match(morningFlow, /const saveApi = redo \? api\.checkin\.redo : api\.checkin\.save/)
  // redo не принимает существующую запись — поля утра не переносятся
  assert.match(checkinSource, /function MorningCheckInFlow\(\{ user, onDone, redo = false \}\)/)
  // в redo значения anxiety/focus остаются null и в payload не попадают
  assert.match(morningFlow, /anxiety: null/)
  assert.match(morningFlow, /focus: null/)
  assert.match(morningFlow, /if \(values\.anxiety != null\) morningPayload\.anxiety = values\.anxiety/)
  assert.match(morningFlow, /if \(values\.focus != null\) morningPayload\.focus = values\.focus/)
  // утренний флоу спрашивает только настроение и энергию
  assert.match(checkinSource, /export const MORNING_SCALE_STEPS = \[SCALE_STEPS\[0\], SCALE_STEPS\[1\]\]/)
  // redo — атомарный PUT сегодняшней записи
  assert.match(apiSource, /redo: \(/)
  assert.match(apiSource, /request\('\/checkin\/today', \{[\s\S]*?method: 'PUT'/)
})

test('redo exit without saving makes no API requests', () => {
  const morningFlow = checkinSource.slice(
    checkinSource.indexOf('function MorningCheckInFlow'),
    checkinSource.indexOf('// ── Чек-ин и вечерний')
  )
  // handleBack at step 0 calls onDone() — no save, no redo, no history fetch
  const handleBack = morningFlow.slice(
    morningFlow.indexOf('function handleBack()'),
    morningFlow.indexOf('async function finish()')
  )
  assert.match(handleBack, /step === 0[\s\S]*?onDone\(\)/)

  const core = checkinSource.slice(
    checkinSource.indexOf('function CheckInCore'),
    checkinSource.indexOf('function CheckIn({')
  )
  // requestClose in evening (redo) calls onDone() directly — no API calls
  const requestClose = core.slice(
    core.indexOf('function requestClose()'),
    core.indexOf('function buildNote()')
  )
  assert.match(requestClose, /if \(!isEvening && draftHasContent\(morningDraft\)\)/)
  assert.match(requestClose, /onDone\(\)/)
})
