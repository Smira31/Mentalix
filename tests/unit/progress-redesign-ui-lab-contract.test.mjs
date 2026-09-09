import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const uiLab = readFileSync(
  new URL('../../src/components/ui-lab/UiLab.jsx', import.meta.url),
  'utf8'
)
const catalog = readFileSync(
  new URL('../../src/components/ui-lab/uiLabCatalog.js', import.meta.url),
  'utf8'
)
const experiment = readFileSync(
  new URL('../../src/components/ui-lab/ProgressRedesignExperiment.jsx', import.meta.url),
  'utf8'
)
const styles = readFileSync(
  new URL('../../src/components/ui-lab/ProgressRedesignExperiment.css', import.meta.url),
  'utf8'
)

test('MXL-PROGRESS-REDESIGN-001 exposes an isolated Preview-only route', () => {
  assert.match(uiLab, /'progress-redesign'/)
  assert.match(uiLab, /section === 'progress-redesign'/)
  assert.match(uiLab, /<ProgressRedesignExperiment \/>/)
  assert.match(catalog, /MXL-PROGRESS-REDESIGN-001.*progress-redesign/)
  assert.doesNotMatch(experiment, /fetchTrendsData|api\.analytics|from ['"].*Analytics/)
})

test('MXL-PROGRESS-REDESIGN-001 covers the complete approved composition', () => {
  for (const copy of [
    'прогресс.',
    'Среднее настроение',
    'Наблюдения',
    'Календарь состояния',
    'Эмоции',
    'Активности',
  ]) {
    assert.match(experiment, new RegExp(copy.replace('.', '\\.')))
  }
  for (const state of ['ready', 'insufficient', 'empty', 'loading', 'error']) {
    assert.match(experiment, new RegExp(`['"]${state}['"]`))
  }
  assert.match(experiment, /\[7, 14, 30, 90\]/)
})

test('MXL-PROGRESS-REDESIGN-001 keeps motion and horizontal gesture scoped', () => {
  assert.match(styles, /\.mx-progress-redesign/)
  assert.match(styles, /scroll-snap-type:\s*x mandatory/)
  assert.match(styles, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(styles, /transition:\s*all/)
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/)
})
