import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)

test('MXL-PRACTICES-CATALOG-POLISH-001 (G3): коллекция открывает единый список практик', () => {
  // Тап по коллекции «Ритуалы»/«Аскезы» ведёт прямо в PracticeListFlow:
  // промежуточный экран «Твои данные» удалён вместе с двойной вложенностью.
  assert.match(source, /<CollectionGrid onOpen=\{onOpenCollection\} \/>/)
  assert.doesNotMatch(source, /CollectionScreen/)
  assert.doesNotMatch(source, /Твои данные/)
  assert.doesNotMatch(source, /mx-layered-category/)
})

test('MXL-547: верхний rail сохраняет рабочую практику и честно блокирует будущие карточки', () => {
  assert.match(source, /key: 'daimon'/)
  assert.match(source, /title: 'Даймон'/)
  assert.match(source, /title: 'Импульс со Львом'/)
  assert.match(source, /title: 'Фокус'/)
  assert.match(source, /disabled=\{!card\.active\}/)
  assert.match(source, /onClick=\{\(\) => card\.active && onOpen\(card\.practice\)\}/)
})
