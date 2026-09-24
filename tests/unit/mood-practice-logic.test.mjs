import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONTEXT_VALUES,
  STEP_INTRO,
  STEP_MOOD,
  STEP_EMOTION,
  STEP_CONTEXT,
  STEP_BREATHING,
  STEP_DONE,
  canProceedFromStep,
  buildMoodPracticePayload,
} from '../../src/lib/moodPracticeLogic.js'

// ── canProceedFromStep ──

test('canProceedFromStep: шаг шкалы требует выбранный mood', () => {
  assert.equal(canProceedFromStep(STEP_MOOD, { mood: null, emotion: null }), false)
  assert.equal(canProceedFromStep(STEP_MOOD, { mood: 3, emotion: null }), true)
  assert.equal(canProceedFromStep(STEP_MOOD, { mood: 1, emotion: 'ровно' }), true)
})

test('canProceedFromStep: шаг эмоций требует выбранную эмоцию', () => {
  assert.equal(canProceedFromStep(STEP_EMOTION, { mood: 3, emotion: null }), false)
  assert.equal(canProceedFromStep(STEP_EMOTION, { mood: 3, emotion: '' }), false)
  assert.equal(canProceedFromStep(STEP_EMOTION, { mood: 3, emotion: 'ровно' }), true)
})

test('canProceedFromStep: шаг контекста всегда доступен (необязательный)', () => {
  assert.equal(canProceedFromStep(STEP_CONTEXT, { mood: null, emotion: null }), true)
  assert.equal(canProceedFromStep(STEP_CONTEXT, { mood: 3, emotion: 'ровно' }), true)
})

test('canProceedFromStep: intro и breathing/done не блокируют', () => {
  assert.equal(canProceedFromStep(STEP_INTRO, { mood: null, emotion: null }), true)
  assert.equal(canProceedFromStep(STEP_BREATHING, { mood: 3, emotion: 'ровно' }), true)
  assert.equal(canProceedFromStep(STEP_DONE, { mood: 3, emotion: 'ровно' }), true)
})

// ── buildMoodPracticePayload ──

test('buildMoodPracticePayload: контекст из списка проходит, неизвестный → null', () => {
  for (const ctx of CONTEXT_VALUES) {
    const payload = buildMoodPracticePayload(
      { mood: 3, emotion: 'ровно', context: ctx, note: '' },
      false
    )
    assert.equal(payload.context, ctx, `контекст ${ctx} должен сохраниться`)
  }

  const payload = buildMoodPracticePayload(
    { mood: 3, emotion: 'ровно', context: 'unknown', note: '' },
    false
  )
  assert.equal(payload.context, null, 'неизвестный контекст → null')
})

test('buildMoodPracticePayload: null-контекст остаётся null', () => {
  const payload = buildMoodPracticePayload(
    { mood: 3, emotion: 'ровно', context: null, note: '' },
    false
  )
  assert.equal(payload.context, null)
})

test('buildMoodPracticePayload: note обрезается, пустая → null', () => {
  const payload = buildMoodPracticePayload(
    { mood: 3, emotion: 'ровно', context: null, note: '  текст  ' },
    false
  )
  assert.equal(payload.note, 'текст')

  const empty = buildMoodPracticePayload(
    { mood: 3, emotion: 'ровно', context: null, note: '   ' },
    false
  )
  assert.equal(empty.note, null)
})

test('buildMoodPracticePayload: breathing_completed передаётся как boolean', () => {
  const withBreathing = buildMoodPracticePayload(
    { mood: 3, emotion: 'ровно', context: null, note: '' },
    true
  )
  assert.equal(withBreathing.breathing_completed, true)

  const withoutBreathing = buildMoodPracticePayload(
    { mood: 3, emotion: 'ровно', context: null, note: '' },
    false
  )
  assert.equal(withoutBreathing.breathing_completed, false)
})

test('buildMoodPracticePayload: все поля корректны в полном payload', () => {
  const payload = buildMoodPracticePayload(
    { mood: 4, emotion: 'спокойно', context: 'work', note: 'хороший день' },
    true
  )
  assert.deepEqual(payload, {
    mood: 4,
    emotion: 'спокойно',
    context: 'work',
    note: 'хороший день',
    breathing_completed: true,
  })
})

// ── Данные не теряются при ошибке сохранения ──
// Логика: save() вызывает buildMoodPracticePayload, но не мутирует
// исходный state. При ошибке setStep(STEP_DONE) не вызывается —
// компонент остаётся на шаге дыхания с сохранёнными mood/emotion/context/note.
// Проверяем, что buildMoodPracticePayload — чистая функция (no side effects).

test('buildMoodPracticePayload: чистая функция, не мутирует входной state', () => {
  const state = { mood: 3, emotion: 'ровно', context: 'work', note: 'текст' }
  const original = { ...state }

  buildMoodPracticePayload(state, true)

  assert.deepEqual(state, original, 'входной объект не должен измениться')
})

test('buildMoodPracticePayload: повторный вызов после ошибки даёт тот же payload', () => {
  const state = { mood: 4, emotion: 'спокойно', context: 'home', note: 'день' }

  const first = buildMoodPracticePayload(state, false)
  // Симулируем ошибку: state не изменился
  const second = buildMoodPracticePayload(state, false)

  assert.deepEqual(first, second, 'повторный вызов с тем же state → тот же payload')
})
