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
const layeredStyles = await readFile(
  new URL('../../src/components/ui-lab/LayeredPracticeCatalogExperiment.css', import.meta.url),
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
  assert.match(catalogSource, /themeError = false/)
  assert.match(catalogSource, /Вопросы не загрузились/)
  assert.match(catalogSource, /Не удалось загрузить тему\. Проверь соединение и попробуй ещё раз\./)
  assert.match(catalogSource, /Пока нет вопросов/)
})

test('MXL-547: каталог использует четыре реальных вопроса текущей темы', () => {
  assert.match(practicesSource, /api\.themes\.get\(currentTheme\.id, user\.id\)/)
  assert.match(catalogSource, /theme\.days\.slice\(0, 4\)/)
  assert.match(catalogSource, /\{question\.day \?\? index \+ 1\}/)
  assert.doesNotMatch(catalogSource, /padStart/)
})

test('MXL-603: layered category art follows theme and accent tokens', () => {
  assert.match(layeredStyles, /\.mx-layered-category__art\s*\{[\s\S]*background: rgb\(var\(--c-artbed\)\)/)
  assert.match(
    layeredStyles,
    /\.mx-layered-category__art-base\s*\{[\s\S]*background: rgb\(var\(--c-gold\) \/ 0\.18\)/
  )
  assert.match(
    layeredStyles,
    /\[data-theme='light'\] \.mx-layered-category__art,\s*\[data-theme='light-preview'\] \.mx-layered-category__art\s*\{[\s\S]*background: rgb\(var\(--c-card2\)\)/
  )
  assert.match(
    layeredStyles,
    /\[data-theme='light'\] \.mx-layered-category__art-base,\s*\[data-theme='light-preview'\] \.mx-layered-category__art-base\s*\{[\s\S]*background: rgb\(var\(--c-gold\) \/ 0\.32\)/
  )
})
