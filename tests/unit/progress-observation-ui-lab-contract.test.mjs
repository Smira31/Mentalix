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
  new URL('../../src/components/ui-lab/ProgressObservationExperiment.jsx', import.meta.url),
  'utf8'
)
const styles = readFileSync(
  new URL('../../src/components/ui-lab/ProgressObservationExperiment.css', import.meta.url),
  'utf8'
)

const normalized = experiment.replace(/\s+/g, ' ')

test('MXL-557 exposes a Preview-only UI Lab route without production integration', () => {
  assert.match(uiLab, /'progress-observation'/)
  assert.match(uiLab, /section === 'progress-observation'/)
  assert.match(uiLab, /<ProgressObservationExperiment \/>/)
  assert.match(catalog, /MXL-PROGRESS-UX-002.*progress-observation/)
  assert.doesNotMatch(experiment, /fetchTrendsData|api\.analytics|from ['"].*Analytics/)
})

test('MXL-557 keeps evidence, caveat and CTA safety states explicit', () => {
  assert.match(normalized, /sampleSize/)
  assert.match(normalized, /sourceDates/)
  assert.match(normalized, /caveat/)
  assert.match(normalized, /loading/)
  assert.match(normalized, /error/)
  assert.match(normalized, /empty/)
  assert.match(normalized, /disabled=\{isAmbiguous\}/)
  assert.match(normalized, /Production не подключён/)
})

test('MXL-557 candidate follows scoped motion and mobile rules', () => {
  assert.match(styles, /mx-progress-observation/)
  assert.match(styles, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(styles, /transition:\s*all/)
})
