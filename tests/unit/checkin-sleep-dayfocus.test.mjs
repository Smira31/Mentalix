import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const morningFieldsSource = await readFile(new URL('../../src/lib/checkinMorningFields.js', import.meta.url), 'utf8')

const morningFlow = checkinSource.slice(
  checkinSource.indexOf('function MorningCheckInFlow'),
  checkinSource.indexOf('// ── Чек-ин и вечерний')
)

const core = checkinSource.slice(
  checkinSource.indexOf('function CheckInCore'),
  checkinSource.indexOf('function CheckIn({')
)

// ── API контракт ──

test('api.checkin.save принимает sleep_quality и day_focus', () => {
  const saveMatch = apiSource.slice(
    apiSource.indexOf('save: ('),
    apiSource.indexOf('redo: (')
  )
  assert.match(saveMatch, /sleep_quality/)
  assert.match(saveMatch, /day_focus/)
})

test('api.checkin.redo принимает sleep_quality и day_focus', () => {
  const redoMatch = apiSource.slice(
    apiSource.indexOf('redo: ('),
    apiSource.indexOf('feedback: (')
  )
  assert.match(redoMatch, /sleep_quality/)
  assert.match(redoMatch, /day_focus/)
})

// ── Утренний флоу: шаги ──

test('утренний флоу содержит шкалу sleep_quality с пятью уровнями', () => {
  assert.match(checkinSource, /key: 'sleep_quality'/)
  assert.match(checkinSource, /title: 'Как ты спал\?'/)
  assert.match(checkinSource, /labels: \['Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'\]/)
})

test('утренний флоу содержит шкалу focus с названием «Уровень концентрации»', () => {
  assert.match(checkinSource, /title: 'Уровень концентрации'/)
  assert.match(checkinSource, /key: 'focus'[\s\S]*?title: 'Уровень концентрации'/)
})

test('MORNING_OPTIONAL_SCALES экспортирована и содержит sleep_quality и focus', () => {
  assert.match(checkinSource, /export const MORNING_OPTIONAL_SCALES = \[SLEEP_QUALITY_STEP, MORNING_FOCUS_STEP\]/)
})

test('утренний флоу содержит шаг day_focus с лимитом 140 символов', () => {
  assert.match(morningFlow, /DAY_FOCUS_MAX/)
  assert.match(checkinSource, /const DAY_FOCUS_MAX = 140/)
  assert.match(morningFlow, /maxLength=\{DAY_FOCUS_MAX\}/)
  assert.match(morningFlow, /data-testid="checkin-day-focus-input"/)
  assert.match(morningFlow, /data-testid="checkin-day-focus-counter"/)
})

// ── Omitted/null семантика ──

test('sleep_quality отправляется только если выбран (omitted/null-семантика)', () => {
  assert.match(morningFlow, /if \(values\.sleep_quality != null\) morningPayload\.sleep_quality = values\.sleep_quality/)
  assert.doesNotMatch(morningFlow, /sleep_quality: values\.sleep_quality \|\| \d/)
})

test('day_focus отправляется только если заполнен (omitted/null-семантика)', () => {
  assert.match(morningFlow, /if \(selectedFocus \|\| dayFocus\.trim\(\)\) morningPayload\.day_focus = selectedFocus \|\| dayFocus\.trim\(\)/)
  assert.doesNotMatch(morningFlow, /day_focus: dayFocus \|\|/)
})

// ── Повторное открытие ──

test('при повторном открытии sleep_quality и day_focus предзаполняются из existing', () => {
  assert.match(morningFlow, /sleep_quality: redo \? null : \(existing\?\.sleep_quality \?\? null\)/)
  assert.match(morningFlow, /focus: redo \? null : \(existing\?\.focus \?\? null\)/)
  assert.match(morningFlow, /existing\?\.day_focus \?\? ''/)
})

test('redo не предзаполняет sleep_quality, focus и day_focus', () => {
  assert.match(morningFlow, /sleep_quality: redo \? null : \(existing\?\.sleep_quality \?\? null\)/)
  assert.match(morningFlow, /redo \|\| DAY_FOCUS_OPTIONS\.some/)
  assert.match(morningFlow, /\? ''\s*: \(existing\?\.day_focus \?\? ''\)/)
})

// ── Вечерний флоу не меняется ──

test('вечерний флоу не содержит шагов sleep_quality и day_focus', () => {
  // CheckInCore не должен рендерить day_focus input
  assert.doesNotMatch(core, /checkin-day-focus-input/)
  // CheckInCore не должен рендерить шкалу sleep_quality
  assert.doesNotMatch(core, /SLEEP_QUALITY_STEP/)
})

test('eveningMorningFields сохраняет sleep_quality и day_focus из existing', () => {
  assert.match(morningFieldsSource, /sleep_quality: existing\.sleep_quality \?\? values\.sleep_quality/)
  assert.match(morningFieldsSource, /day_focus: existing\.day_focus \?\? values\.day_focus/)
})

// ── Шаги в правильном порядке ──

test('day_focus шаг находится перед note и перед done', () => {
  assert.match(morningFlow, /const dayFocusStep = allScales\.length/)
  assert.match(morningFlow, /const noteStep = dayFocusStep \+ 1/)
  assert.match(morningFlow, /const doneStep = noteStep \+ 1/)
})

test('каждая утренняя шкала имеет кнопку «Пропустить», даже при обязательном ответе для «Далее»', () => {
  assert.match(morningFlow, /onSkip=\{\(\) => goToStep\(current => Math\.min\(doneStep, current \+ 1\)\)\}/)
  assert.match(morningFlow, /allScales\[step\]\?\.required/)
})

test('плитка и собственный текст не дублируют друг друга', () => {
  assert.match(morningFlow, /aria-pressed=\{selectedFocus === label\}/)
  // Повторный тап снимает выбор: toggle вместо прямого set
  assert.match(morningFlow, /setSelectedFocus\(prev => \(prev === label \? null : label\)\)/)
  assert.match(morningFlow, /setDayFocus\(''\)/)
  assert.match(morningFlow, /setSelectedFocus\(null\)/)
  assert.doesNotMatch(morningFlow, /setDayFocus\(label\)/)
})

test('на шаге «Что на уме?» нет кнопки добавления вложения', () => {
  assert.match(morningFlow, /hideAddAction/)
  assert.doesNotMatch(morningFlow, /showAddAction/)
})
