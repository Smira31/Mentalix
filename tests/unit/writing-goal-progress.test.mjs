import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const api = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const settings = await readFile(new URL('../../src/screens/Settings.jsx', import.meta.url), 'utf8')
const normalized = settings.replace(/\s+/g, ' ')

test('profile adapter exposes the bounded weekly writing-goal progress contract', () => {
  assert.match(api, /writingGoalProgress: userId =>/)
  assert.match(api, /\/profile\/writing-goal\/progress/)
})

test('Settings loads and refreshes weekly writing-goal progress after a saved target', () => {
  assert.match(settings, /api\.profile\.writingGoalProgress\(user\.id\)/)
  assert.match(settings, /await loadWritingGoalProgress\(\)/)
  assert.match(settings, /Не удалось загрузить прогресс цели\. Сама цель не изменилась\./)
  assert.match(settings, /Повторить/)
})

test('weekly goal progress is descriptive and does not penalize missed days', () => {
  assert.match(normalized, /Это мягкий ориентир, не серия и не оценка: пропущенные дни не считаются против тебя\./)
  assert.match(normalized, /Можно писать дальше только если тебе хочется\./)
  assert.doesNotMatch(normalized, /пропуск.*снижает.*оценк|наказани[ея].*за пропуск/i)
})

test('progress surface remains accessible and bounded to a percentage', () => {
  assert.match(settings, /aria-label=\{`Прогресс цели письма:/)
  assert.match(settings, /Math\.min\(100, Math\.round/)
  assert.match(settings, /Эта неделя: \{writingGoalProgress\.completed\} из \{writingGoalProgress\.goal\}/)
})
