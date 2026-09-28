import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { isAscezaHeldToday, isRitualDoneToday } from '../../src/lib/practiceDoneToday.js'

test('светлой считается только плитка, реально отмеченная сегодня', () => {
  assert.equal(isRitualDoneToday({ today_level: 'optimal' }), true)
  assert.equal(isRitualDoneToday({ today_level: 'min' }), true)
  assert.equal(isRitualDoneToday({ today_level: true }), true)
  for (const level of [null, undefined, false, '', 'none', 'skip', 0]) {
    assert.equal(isRitualDoneToday({ today_level: level }), false, String(level))
  }
  assert.equal(isAscezaHeldToday({ today_status: 'held' }), true)
  for (const status of [null, 'broken', 'none', '']) {
    assert.equal(isAscezaHeldToday({ today_status: status }), false, String(status))
  }
})

test('деталь практики скрывает пустые поля, «+ Новый…» — пилюля', async () => {
  const detail = await readFile(new URL('../../src/components/PracticeDetail.jsx', import.meta.url), 'utf8')
  const rituals = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
  const ascezas = await readFile(new URL('../../src/screens/Ascezas.jsx', import.meta.url), 'utf8')
  assert.match(detail, /if \(!hasText\(text\)\) return null/)
  for (const source of [rituals, ascezas]) {
    assert.match(source, /className="mx-practice-list-screen__create cta-pill"/)
  }
})
