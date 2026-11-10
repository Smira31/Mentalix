import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import { formatCount } from '../../src/lib/pluralize.js'

// ISSUE #1184 — «Пульс» на «Сегодня» при activeToday = 0 не показывает
// «отмечают 0 человек»: строка пустая (неразрывный пробел + opacity 0),
// место под неё сохраняется. Тексты 1 / 2–4 / 5–19 / ≥ 20 не меняются.

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

const today = read('src/screens/Today.jsx')

const PEOPLE_FORMS = ['человек', 'человека', 'человек']

const pulseBlock = (() => {
  const start = today.indexOf('className="mx-today-pulse"')
  assert.ok(start > -1, 'строка «Пульс» (mx-today-pulse) должна остаться')
  const end = today.indexOf('</p>', start)
  assert.ok(end > start, 'блок «Пульс» должен быть <p>')
  return today.slice(start, end)
})()

test('«Сегодня»: при 0 и при null «Пульс» пустой, а не «отмечают 0 человек»', () => {
  // Число показывается только когда оно больше нуля.
  assert.doesNotMatch(pulseBlock, /activeToday != null/)
  assert.doesNotMatch(pulseBlock, /activeToday === 0/)
  assert.match(pulseBlock, /activeToday > 0/)
  // Пустое состояние — неразрывный пробел, как раньше при null.
  assert.match(pulseBlock, /'\\u00A0'/)
})

test('«Сегодня»: «Пульс» виден только при ненулевом числе, место сохраняется', () => {
  // opacity — единственное изменение видимости: разметка и высота строки прежние.
  assert.match(pulseBlock, /opacity: activeToday > 0 \? 1 : 0/)
  assert.match(pulseBlock, /transition: 'opacity 200ms ease'/)
})

test('«Сегодня»: тексты «Пульса» при 1, 2–4, 5–19 и ≥ 20 не изменились', () => {
  assert.match(pulseBlock, /Сегодня день \$\{activeToday === 1 \? 'отмечает' : 'отмечают'\}/)
  assert.match(pulseBlock, /\['человек', 'человека', 'человек'\]/)
  assert.match(pulseBlock, /Сегодня свой путь продолжили/)
  assert.equal(formatCount(1, PEOPLE_FORMS), '1 человек')
  assert.equal(formatCount(2, PEOPLE_FORMS), '2 человека')
  assert.equal(formatCount(4, PEOPLE_FORMS), '4 человека')
  assert.equal(formatCount(5, PEOPLE_FORMS), '5 человек')
  assert.equal(formatCount(19, PEOPLE_FORMS), '19 человек')
})
