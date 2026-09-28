/**
 * Regression coverage for evening check-in completion grammar.
 *
 * Контракты (см. задачу «Окно C»):
 * 1. Заголовок вечернего completion = «Чек-ин завершён»
 * 2. Primary CTA = «Вернуться в Сегодня» (testId checkin-back-to-today)
 * 3. streak > 0 → отображается «N-дневная серия» (testId checkin-streak)
 * 4. streak fetch failure не блокирует completion (streak остаётся 0 — не показывается)
 * 5. morning completion не изменился (заголовок «Чек-ин завершён» в MorningCheckInFlow)
 * 6. evening feedback «Было полезно?» продолжает работать
 * 7. Scout/surprise flow не сломан (testId checkin-open-scout, surprise-insight)
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinPath = new URL('../../src/screens/CheckIn.jsx', import.meta.url)
let checkinSource = null

async function getSource() {
  if (!checkinSource) {
    checkinSource = await readFile(checkinPath, 'utf8')
  }
  return checkinSource
}

function getCore(src) {
  return src.slice(src.indexOf('function CheckInCore'), src.indexOf('function CheckIn({'))
}

function getMorningFlow(src) {
  return src.slice(
    src.indexOf('function MorningCheckInFlow'),
    src.indexOf('// ── Чек-ин и вечерний')
  )
}

test('1. вечерний completion: заголовок = «Чек-ин завершён»', async () => {
  const src = await getSource()
  const core = getCore(src)
  assert.match(core, /Чек-ин завершён/, 'вечерний completion должен содержать «Чек-ин завершён»')
})

test('2. вечерний completion: primary CTA = «Вернуться в Сегодня»', async () => {
  const src = await getSource()
  const core = getCore(src)
  assert.match(core, /Вернуться в Сегодня/, 'вечерний CTA должен быть «Вернуться в Сегодня»')
  assert.match(
    core,
    /testId: isEvening \? 'checkin-back-to-today' : 'checkin-complete'/,
    'testId вечернего CTA — checkin-back-to-today'
  )
})

test('3. вечерний completion: streak > 0 → «N-дневная серия» (testId checkin-streak)', async () => {
  const src = await getSource()
  const core = getCore(src)
  // Условный рендер streak только для вечера при серверной серии > 0
  assert.match(
    core,
    /isEvening && canonicalEveningStreak > 0/,
    'streak отображается только для вечера и только при серверной серии > 0'
  )
  assert.match(core, /data-testid="checkin-streak"/, 'streak имеет testId checkin-streak')
  assert.match(
    core,
    /\{canonicalEveningStreak\}-дневная серия/,
    'текст streak: «N-дневная серия»'
  )
})

test('4. вечерний completion: streak fetch failure не блокирует completion', async () => {
  const src = await getSource()
  const core = getCore(src)
  // Вечерний путь: setStep(doneStep) вызывается ДО try/catch history fetch,
  // значит сбой fetch не мешает открытию completion.
  // Находим вечерний else-блок по уникальному паттерну setStep(doneStep)
  const doneStepIdx = core.indexOf('setStep(doneStep)')
  assert.ok(doneStepIdx >= 0, 'setStep(doneStep) должен присутствовать в CheckInCore')
  const afterDoneStep = core.slice(doneStepIdx)
  assert.match(afterDoneStep, /Promise\.allSettled\(\[/, 'ошибка серии не блокирует завершение')
  assert.match(afterDoneStep, /api\.checkin\.history\(user\.id, 90\)/)
  assert.match(afterDoneStep, /api\.streak\(user\.id\)/)
})

test('5. morning completion не изменился: заголовок «Чек-ин завершён»', async () => {
  const src = await getSource()
  const morning = getMorningFlow(src)
  assert.match(morning, /Чек-ин завершён/, 'morning completion содержит «Чек-ин завершён»')
  assert.match(morning, /checkin-back-to-today/, 'morning CTA testId = checkin-back-to-today')
})

test('6. evening feedback «Было полезно?» продолжает работать', async () => {
  const src = await getSource()
  const core = getCore(src)
  assert.match(core, /Было полезно\?/, 'feedback «Было полезно?» присутствует')
  assert.match(core, /data-testid="checkin-feedback-option"/, 'feedback options имеют testId')
  assert.match(core, /sendCheckinFeedback/, 'sendCheckinFeedback вызывается')
})

test('7. Scout/surprise flow не сломан', async () => {
  const src = await getSource()
  const core = getCore(src)
  assert.match(core, /data-testid="surprise-insight"/, 'surprise insight блок сохранён')
  assert.match(core, /data-testid="surprise-insight-open"/, 'surprise open кнопка сохранена')
  assert.match(core, /'checkin-open-scout'/, 'scout кнопка (skipAction) сохранена')
  assert.match(core, /maybeBuildSurprise/, 'maybeBuildSurprise вызов сохранён')
  assert.match(core, /openScout/, 'openScout функция сохранена')
})

test('вечерняя история сохраняется для значков, без клиентского расчёта серии', async () => {
  const src = await getSource()
  const core = getCore(src)
  // История по-прежнему нужна (значки, surprise), но число серии
  // приходит только из canonical-ответа сервера.
  assert.match(core, /api\.checkin\.history\(user\.id, 90\)\.then\(history =>/)
  assert.match(core, /setStreakHistory\(entries\)/)
  assert.doesNotMatch(core, /currentCheckinStreak/, 'legacy-расчёт серии удалён')
  assert.doesNotMatch(core, /canonicalEveningStreak \?\? streak/, 'fallback-подмена удалена')
})

console.log('Evening completion grammar regression tests loaded')
