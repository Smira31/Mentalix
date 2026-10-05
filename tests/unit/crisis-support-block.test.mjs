import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../../src/${path}`, import.meta.url), 'utf8')

const block = await read('components/CrisisSupportBlock.jsx')
const data = await read('lib/crisisSupport.js')
const settings = await read('screens/Settings.jsx')

test('блок кризисной помощи отображается в профиле', () => {
  // Settings.jsx (экран профиля) импортирует и рендерит CrisisSupportBlock.
  assert.match(settings, /import\s+CrisisSupportBlock\s+from\s+'[^']*CrisisSupportBlock'/)
  assert.match(settings, /<CrisisSupportBlock\s*\/>/)
})

test('блок содержит заголовок «Нужна помощь прямо сейчас»', () => {
  assert.match(data, /'Нужна помощь прямо сейчас'/)
  assert.match(block, /CRISIS_PROFILE\.title/)
})

test('отображается номер 112', () => {
  assert.match(data, /CRISIS_HOTLINE_112\s*=\s*'112'/)
  // В блоке номер выводится из line.number.
  assert.match(block, /line\.number/)
})

test('отображаются номера 8-800-333-44-34 и 8-800-100-49-94', () => {
  assert.match(data, /CRISIS_HOTLINE_1\s*=\s*'8-800-333-44-34'/)
  assert.match(data, /CRISIS_HOTLINE_2\s*=\s*'8-800-100-49-94'/)
})

test('ссылки используют корректные tel: URI', () => {
  assert.match(data, /CRISIS_TEL_112\s*=\s*'tel:112'/)
  assert.match(data, /CRISIS_TEL_1\s*=\s*'tel:88003334434'/)
  assert.match(data, /CRISIS_TEL_2\s*=\s*'tel:88001004994'/)
  // Блок рендерит href из line.tel.
  assert.match(block, /href=\{line\.tel\}/)
})

test('112 подписан как номер при угрозе жизни', () => {
  assert.match(data, /Если есть угроза жизни прямо сейчас/)
  // В CRISIS_PROFILE первая линия (112) использует эту подпись.
  assert.match(
    data,
    /label:\s*'Если есть угроза жизни прямо сейчас'[^}]*number:\s*CRISIS_HOTLINE_112/
  )
})

test('номера 8-800 подписаны как бесплатная круглосуточная психологическая помощь', () => {
  assert.match(data, /Поговорить с психологом бесплатно и круглосуточно/)
  // Оба номера 8-800 несут эту подпись.
  assert.match(
    data,
    /label:\s*'Поговорить с психологом бесплатно и круглосуточно'[^}]*number:\s*CRISIS_HOTLINE_1/
  )
  assert.match(
    data,
    /label:\s*'Поговорить с психологом бесплатно и круглосуточно'[^}]*number:\s*CRISIS_HOTLINE_2/
  )
})
