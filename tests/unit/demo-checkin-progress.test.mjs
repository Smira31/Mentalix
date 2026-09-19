import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')

test('Вечерний Check-In не показывает локальный счётчик или точки прогресса', () => {
  assert.doesNotMatch(checkinSource, /Анализ дня · \$\{step \+ 1\} из \$\{totalSteps\}/)
})
