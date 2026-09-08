import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const practicesSource = await readFile(
  new URL('../../src/screens/Practices.jsx', import.meta.url),
  'utf8'
)
const catalogSource = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)

test('MXL-525 (G5): тема недели ставит is_current первой', () => {
  assert.match(
    practicesSource,
    /\(b\.is_current === true \? 1 : 0\) - \(a\.is_current === true \? 1 : 0\)/
  )
})

test('MXL-525 (G5): ошибка загрузки тем отделена от пустого состояния', () => {
  assert.match(practicesSource, /setThemesError\(true\)/)
  assert.match(catalogSource, /themesError = false/)
  assert.match(catalogSource, /Темы не загрузились/)
  assert.match(catalogSource, /Не удалось загрузить темы\. Проверь соединение и попробуй ещё раз\./)
  assert.match(catalogSource, /Пока нет тем/)
})
