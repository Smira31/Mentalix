import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  emptyProgress,
  parseProgress,
  mergeProgress,
  heroProgressKey,
  heroDraftKey,
  isStepAvailable,
} from '../../src/lib/heroJourneyState.js'
import {
  switchUserDataScope,
  resetUserDataScopeForTests,
  migrateHeroJourneyProgress,
} from '../../src/lib/userDataScope.js'
import { clearAllLocalUserData } from '../../src/lib/localUserData.js'

function storage() {
  const values = new Map()
  return {
    get length() {
      return values.size
    },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}

function setup() {
  globalThis.window = { localStorage: storage(), sessionStorage: storage() }
  resetUserDataScopeForTests()
  return window.localStorage
}

const dataSource = (
  await readFile(new URL('../../src/data/heroJourney.js', import.meta.url), 'utf8')
).replace(/^import (\w+) from '[^']+\.(?:svg|webp|avif|png|jpe?g|gif)'$/gm, "const $1 = ''")
const { HERO_JOURNEY_TRIALS, previousTrial } = await import(
  `data:text/javascript;base64,${Buffer.from(dataSource).toString('base64')}`
)

test('слияние возвращает JSON-строку, сохраняет ответы и оба набора прогресса', () => {
  const local = {
    ...emptyProgress(),
    completed: { uncertainty: '2026-10-01' },
    reflections: { uncertainty: 'Ответ' },
  }
  const remote = {
    ...emptyProgress(),
    completed: { temporality: '2026-10-02' },
    actions: { temporality: 'Действие' },
  }
  const result = mergeProgress(JSON.stringify(local), JSON.stringify(remote))
  assert.equal(typeof result, 'string')
  const progress = JSON.parse(result)
  assert.equal(Object.keys(progress.completed).length, 2)
  assert.equal(progress.reflections.uncertainty, 'Ответ')
  assert.equal(progress.actions.temporality, 'Действие')
})

for (const raw of ['[object Object]', '{broken', 'null', '[]', '', undefined]) {
  test(`испорченные данные ${raw}: облачная копия либо пустой прогресс`, () => {
    const remote = { ...emptyProgress(), completed: { uncertainty: '2026-10-01' } }
    assert.deepEqual(parseProgress(raw), emptyProgress())
    assert.deepEqual(parseProgress(mergeProgress(raw, null)), emptyProgress())
    assert.deepEqual(parseProgress(mergeProgress(raw, JSON.stringify(remote))), remote)
  })
}

test('legacy-ключ переносится один раз до очистки scope, B не получает ответы A', () => {
  const local = setup()
  const legacy = JSON.stringify({
    ...emptyProgress(),
    reflections: { uncertainty: 'Личный ответ A' },
  })
  local.setItem('mx-hero-journey-progress', legacy)
  switchUserDataScope(101)
  assert.equal(local.getItem(heroProgressKey(101)), legacy)
  assert.equal(local.getItem('mx-hero-journey-progress'), null)
  local.setItem(heroDraftKey(101, 'uncertainty'), 'Черновик A')
  switchUserDataScope(202)
  assert.equal(local.getItem(heroProgressKey(202)), null)
  assert.equal(local.getItem(heroProgressKey(101)), null)
  assert.equal(local.getItem(heroDraftKey(101, 'uncertainty')), null)
})

test('гостевой ID поддерживается, близкие ID не совпадают при очистке', () => {
  const local = setup()
  assert.equal(heroProgressKey(-42), 'mx-hero-journey-progress:-42')
  assert.equal(heroDraftKey(-42, 'uncertainty'), 'mx-hero-journey-draft:-42:uncertainty')
  local.setItem(heroProgressKey(1011), '{}')
  switchUserDataScope(101)
  assert.equal(local.getItem(heroProgressKey(1011)), null)
})

test('миграция не перезаписывает существующий scoped-прогресс', () => {
  const local = setup()
  local.setItem(heroProgressKey(101), 'existing')
  local.setItem('mx-hero-journey-progress', 'legacy')
  migrateHeroJourneyProgress(101)
  assert.equal(local.getItem(heroProgressKey(101)), 'existing')
  assert.equal(local.getItem('mx-hero-journey-progress'), null)
})

test('полное удаление аккаунта очищает прогресс и черновики', () => {
  const local = setup()
  local.setItem(heroProgressKey(101), '{}')
  local.setItem(heroDraftKey(101, 'uncertainty'), '{}')
  clearAllLocalUserData()
  assert.equal(local.length, 0)
})

for (const number of [5, 9, 13]) {
  test(`первый шаг главы (${number}) использует предыдущий шаг всего курса`, () => {
    const trial = HERO_JOURNEY_TRIALS[number - 1]
    const previous = previousTrial(trial.id)
    assert.equal(previous.number, number - 1)
    const progress = { ...emptyProgress(), completed: { [previous.id]: '2026-10-01T12:00:00Z' } }
    assert.equal(
      isStepAvailable(number, previous.id, progress, false, new Date('2026-10-02T12:00:00Z')),
      true
    )
    assert.equal(isStepAvailable(number, previous.id, emptyProgress(), true), false)
  })
}

test('открытие ровно в полночь МСК независимо от часового пояса устройства', () => {
  const progress = { ...emptyProgress(), completed: { uncertainty: '2026-10-02T20:59:00Z' } }
  assert.equal(
    isStepAvailable(2, 'uncertainty', progress, false, new Date('2026-10-02T20:59:59Z')),
    false
  )
  assert.equal(
    isStepAvailable(2, 'uncertainty', progress, false, new Date('2026-10-02T21:00:00Z')),
    true
  )
  progress.completed.uncertainty = 'invalid'
  assert.equal(isStepAvailable(2, 'uncertainty', progress), false)
})
