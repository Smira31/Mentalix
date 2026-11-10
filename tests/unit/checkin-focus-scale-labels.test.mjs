import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// ISSUE #1183 — нейтральные подписи шкалы концентрации без мужского рода.
// Подписи заданы одной константой: её используют и focus в SCALE_STEPS,
// и MORNING_FOCUS_STEP. Числовые значения 1–5, ключи, заголовки и подсказки
// шкал, остальные шкалы и слова эмоций остаются прежними.

const checkin = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')
const emotionStep = await readFile(
  new URL('../../src/components/EmotionStep.jsx', import.meta.url),
  'utf8'
)

// Объекты шкал: плоские литералы { key, title, hint, labels }, без вложенных скобок.
const scaleObjects = [...checkin.matchAll(/\{[^{}]*key: '[a-z_]+'[^{}]*\}/g)].map(
  match => match[0]
)
const focusScales = scaleObjects.filter(source => source.includes("key: 'focus'"))

const focusLabelsMatch = checkin.match(/export const FOCUS_SCALE_LABELS = \[([^\]]*)\]/)
const focusLabels = focusLabelsMatch
  ? focusLabelsMatch[1]
      .split(',')
      .map(item => item.trim().replace(/^'|'$/g, ''))
      .filter(Boolean)
  : []

test('подписи шкалы концентрации заданы одной константой из пяти нейтральных слов', () => {
  assert.ok(focusLabelsMatch, 'в CheckIn.jsx должна быть константа FOCUS_SCALE_LABELS')
  assert.deepEqual(focusLabels, ['Шумно', 'Плыву', 'Держусь', 'Собранно', 'Ясно'])
})

test('обе шкалы focus берут одну и ту же константу подписей', () => {
  assert.equal(focusScales.length, 2, 'в CheckIn.jsx должно быть ровно две шкалы focus')
  for (const source of focusScales) {
    assert.match(source, /labels: FOCUS_SCALE_LABELS/)
  }
  assert.equal(
    (checkin.match(/labels: FOCUS_SCALE_LABELS/g) || []).length,
    2,
    'константу используют и SCALE_STEPS, и MORNING_FOCUS_STEP'
  )
  // Заголовки и подсказки шкал не меняются.
  assert.match(
    focusScales[0],
    /title: 'Насколько ты собран\?'[\s\S]*hint: 'Где сейчас твоё внимание'/
  )
  assert.match(
    focusScales[1],
    /title: 'Уровень концентрации'[\s\S]*hint: 'Где сейчас твоё внимание'/
  )
  // Уровней по-прежнему пять.
  assert.equal(focusLabels.length, 5)
})

test('в подписях шкал нет слов «Рассеян», «Собран», «Кристально»', () => {
  const labelArrays = [...checkin.matchAll(/labels: (\[[^\]]*\]|FOCUS_SCALE_LABELS)/g)].map(
    match => match[1]
  )
  assert.ok(labelArrays.length >= 5, 'шкалы с подписями должны остаться в файле')

  const literalLabels = labelArrays.filter(source => source.startsWith('[')).join(' ')
  assert.doesNotMatch(literalLabels, /Рассеян/)
  assert.doesNotMatch(literalLabels, /Собран'/)
  assert.doesNotMatch(literalLabels, /Кристально/)
  assert.doesNotMatch(literalLabels, /'Собран'/)

  // В самом файле этих подписей тоже нет — кроме словарных слов эмоций
  // (они в нижнем регистре и живут в данных, а не в подписях шкал).
  assert.doesNotMatch(checkin, /Рассеян/)
  assert.doesNotMatch(checkin, /Кристально/)
  assert.doesNotMatch(checkin, /'Собран'/)
})

test('остальные шкалы не изменились', () => {
  assert.match(checkin, /labels: \['Тяжко', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'\]/)
  assert.match(checkin, /labels: \['На нуле', 'Мало', 'Средне', 'Много', 'Через край'\]/)
  assert.match(checkin, /labels: \['Тихо', 'Слегка', 'Заметно', 'Сильно', 'Штормит'\]/)
  assert.match(
    checkin,
    /labels: \['Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'\]/
  )
})

test('слова эмоций остались в данных и не затронуты', () => {
  assert.match(checkin, /2: \['устал', 'раздражён', 'рассеян'/)
  assert.match(checkin, /'нейтрально', 'собранно'/)
  assert.match(checkin, /const HEAVY_EMOTIONS = \['тревожно', 'подавлен', 'страшно'\]/)
  assert.match(checkin, /export const EVENING_EMOTIONS = \{/)
  assert.doesNotMatch(emotionStep, /Шумно|Собранно|Ясно/)
})
