import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { resolveDesyncStep } from '../../src/lib/checkinDesync.js'

const checkinSource = await readFile(
  new URL('../../src/screens/CheckIn.jsx', import.meta.url),
  'utf8'
)

// ── Воспроизведение смены existing во время шага шкалы ──
//
// Сценарий: вечерний режим, existing = null → scales активны (scaleCount=2,
// doneStep=6). Пользователь на шаге 1 (energy scale). В этот момент existing
// приходит с бэкенда (рассинхрон) — skipScales становится true, scaleCount=0,
// doneStep=4. Шаг 1 теперь за пределами шкал, но в валидном диапазоне карточек.
// Пользователь не должен застрять.

test('рассинхрон: existing пришёл во время шага шкалы — step остаётся валидным (card)', () => {
  // До: existing=null, step=1 (energy scale), doneStep=6
  // После: existing={...}, doneStep=4, isScaleStep=false (isCard=true)
  const next = resolveDesyncStep({
    step: 1,
    doneStep: 4,
    isScaleStep: false,
    scaleStepsLength: 2,
  })
  assert.equal(next, 1, 'шаг 1 валиден как cardIdx=0 — без изменений')
})

test('рассинхрон: existing ушёл во время шага шкалы — step остаётся валидным (scale)', () => {
  // До: existing={...}, skipScales=true, step=0 (emotion), doneStep=4
  // После: existing=null, skipScales=false, doneStep=6, isScaleStep=true (mood)
  const next = resolveDesyncStep({
    step: 0,
    doneStep: 6,
    isScaleStep: true,
    scaleStepsLength: 2,
  })
  assert.equal(next, 0, 'шаг 0 валиден как mood scale — без изменений')
})

test('рассинхрон: existing ушёл, step=1 — energy scale валидна', () => {
  // До: existing={...}, skipScales=true, step=1 (cardIdx=0), doneStep=4
  // После: existing=null, skipScales=false, doneStep=6, isScaleStep=true (energy)
  const next = resolveDesyncStep({
    step: 1,
    doneStep: 6,
    isScaleStep: true,
    scaleStepsLength: 2,
  })
  assert.equal(next, 1, 'шаг 1 валиден как energy scale — без изменений')
})

test('рассинхрон: layout сжался, step за пределами doneStep — зажимаем на последний валидный', () => {
  // До: existing=null, step=5 (cardIdx=2), doneStep=6
  // После: existing={...}, doneStep=4 — step=5 >= doneStep=4
  const next = resolveDesyncStep({
    step: 5,
    doneStep: 4,
    isScaleStep: false,
    scaleStepsLength: 2,
  })
  assert.equal(next, 3, 'зажимаем на doneStep-1=3 — последний cardIdx=2')
})

test('рассинхрон: пустой шаг шкалы (step >= scaleStepsLength) — пропускаем', () => {
  // Защитный сценарий: isScaleStep=true, но step за пределами массива шкал
  const next = resolveDesyncStep({
    step: 3,
    doneStep: 6,
    isScaleStep: true,
    scaleStepsLength: 2,
  })
  assert.equal(next, 4, 'пропускаем пустой шаг — step+1=4')
})

test('рассинхрон: doneStep=0 — зажимаем на 0', () => {
  const next = resolveDesyncStep({
    step: 5,
    doneStep: 0,
    isScaleStep: false,
    scaleStepsLength: 2,
  })
  assert.equal(next, 0, 'Math.max(0, doneStep-1)=0')
})

test('рассинхрон: валидный card-шаг — без изменений', () => {
  const next = resolveDesyncStep({
    step: 3,
    doneStep: 6,
    isScaleStep: false,
    scaleStepsLength: 2,
  })
  assert.equal(next, 3)
})

// ── Контракт: CheckIn.jsx использует resolveDesyncStep ──

test('CheckIn.jsx импортирует resolveDesyncStep', () => {
  assert.match(
    checkinSource,
    /import \{ resolveDesyncStep \} from '\.\.\/lib\/checkinDesync'/
  )
})

test('CheckIn.jsx вызывает resolveDesyncStep в useEffect при рассинхроне', () => {
  assert.match(
    checkinSource,
    /useEffect\(\(\) => \{[\s\S]*?resolveDesyncStep\(\{[\s\S]*?step,[\s\S]*?doneStep,[\s\S]*?isScaleStep,[\s\S]*?scaleStepsLength: MORNING_SCALE_STEPS\.length[\s\S]*?\}\)[\s\S]*?\}/
  )
})

test('CheckIn.jsx обновляет step только при изменении', () => {
  assert.match(checkinSource, /if \(nextStep !== step\) \{[\s\S]*?setStep\(nextStep\)/)
})

test('CheckIn.jsx сохраняет guard scale && для рендера', () => {
  assert.match(checkinSource, /\{isScaleStep && scale && \(/)
})
