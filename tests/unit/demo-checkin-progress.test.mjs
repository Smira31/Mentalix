import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(new URL('../../src/screens/CheckIn.jsx', import.meta.url), 'utf8')

test('Demo-редактор Check-In использует фактический шестой шаг из шести', () => {
  assert.doesNotMatch(checkinSource, /ЧЕК-ИН · 4 ИЗ 6/)
  assert.match(
    checkinSource,
    /const stepLabel = `\$\{isEvening \? 'Анализ дня' : 'Чек-ин'\} · \$\{step \+ 1\} из \$\{totalSteps\}`/
  )
})
