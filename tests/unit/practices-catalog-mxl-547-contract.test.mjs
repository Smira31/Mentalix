import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const catalog = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)
const practices = await readFile(
  new URL('../../src/screens/Practices.jsx', import.meta.url),
  'utf8'
)
const lab = await readFile(
  new URL('../../src/components/ui-lab/LayeredPracticeCatalogExperiment.jsx', import.meta.url),
  'utf8'
)
const styles = await readFile(
  new URL('../../src/components/ui-lab/LayeredPracticeCatalogExperiment.css', import.meta.url),
  'utf8'
)

test('MXL-547: production rail содержит Лилу и две честные карточки «Скоро»', () => {
  assert.match(catalog, /Новое и рекомендованное/)
  assert.match(catalog, /Разобраться через Лилу/)
  assert.match(catalog, /Импульс к действию с Львом/)
  assert.match(catalog, /title: 'Фокус'/)
  assert.match(catalog, /disabled={!card\.active}/)
  assert.match(catalog, /onOpen\(card\.practice\)/)
  assert.doesNotMatch(catalog, /•••/)
})

test('MXL-547: отдельная Лила скрыта только из отображаемых коллекций', () => {
  assert.match(catalog, /PRACTICE_COLLECTIONS\.filter\(collection => collection\.key !== 'lila'\)/)
  assert.match(catalog, /VISIBLE_COLLECTIONS\.length/)
  assert.match(
    catalog,
    /PRACTICE_COLLECTIONS\.find\(collection => collection\.key === selectedCollectionKey\)/
  )
})

test('MXL-547: каталог показывает максимум четыре реальных дня текущей темы', () => {
  assert.match(practices, /api\.themes\.get\(currentTheme\.id, user\.id\)/)
  assert.match(practices, /setThemes\(\[\{ \.\.\.currentTheme, \.\.\.detail \}\]\)/)
  assert.match(catalog, /theme\.days\.slice\(0, 4\)/)
  assert.match(catalog, /question\.day/)
  assert.match(catalog, /question\.text/)
  assert.match(catalog, /question\.prompt/)
  assert.match(catalog, /Начать запись/)
  assert.doesNotMatch(catalog, /padStart/)
  assert.doesNotMatch(catalog, /layeredPracticeCatalogDemoData/)
})

test('MXL-547: одна scoped-геометрия используется UI Lab и production', () => {
  const modifier = 'mx-layered-catalog--mxl-547-preview'
  assert.match(catalog, new RegExp(modifier))
  assert.match(lab, new RegExp(modifier))
  assert.match(styles, new RegExp(`\\.${modifier} \\.mx-layered-catalog__theme-section`))
})
