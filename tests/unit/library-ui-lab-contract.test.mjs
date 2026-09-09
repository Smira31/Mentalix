import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const uiLab = readFileSync(new URL('../../src/components/ui-lab/UiLab.jsx', import.meta.url), 'utf8')
const experiment = readFileSync(
  new URL('../../src/components/ui-lab/LibraryExperiment.jsx', import.meta.url),
  'utf8'
)
const styles = readFileSync(
  new URL('../../src/components/ui-lab/LibraryExperiment.css', import.meta.url),
  'utf8'
)

test('MXL-526 exposes a dedicated Preview-only Library route', () => {
  assert.match(uiLab, /'library'/)
  assert.match(uiLab, /section === 'library'/)
  assert.match(uiLab, /<LibraryExperiment \/>/)
})

test('MXL-526 keeps the approved Library functions and boundaries visible', () => {
  assert.match(experiment, /Статьи/)
  assert.match(experiment, /Направленные записи/)
  assert.match(experiment, /Практикумы/)
  assert.match(experiment, /СКОРО/)
  assert.match(experiment, /Загрузка/)
  assert.match(experiment, /Ошибка/)
  assert.match(experiment, /Пусто/)
  assert.match(experiment, /Web/)
  assert.match(experiment, /key=\{article \? `article-\$\{article\.id\}` : `\$\{screen\}-\$\{state\}`\}/)
})

test('MXL-526 visual rules stay scoped and use native horizontal snap', () => {
  assert.match(styles, /\.mx-library-lab/)
  assert.match(styles, /scroll-snap-type:\s*x mandatory/)
  assert.match(styles, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(styles, /transition:\s*all/)
})
