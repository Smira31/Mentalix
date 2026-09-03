import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const component = fs.readFileSync(new URL('../../src/components/ui-lab/FocusCheck.jsx', import.meta.url), 'utf8')
const main = fs.readFileSync(new URL('../../src/main.jsx', import.meta.url), 'utf8')
const journal = fs.readFileSync(new URL('../../docs/working/ui-lab/EXPERIMENT_JOURNAL.md', import.meta.url), 'utf8')

test('focused-check reads UI-EXP-003 from the experiment journal', () => {
  assert.match(component, /EXPERIMENT_JOURNAL\.md\?raw/)
  assert.match(component, /UI-EXP-003/)
  assert.match(journal, /`UI-EXP-003`.*`manual-gate`/s)
})

test('focused-check opens the isolated UI Lab route, never a production tab', () => {
  assert.match(component, /PREVIEW_HREF = '\?ui_lab=practice-catalog'/)
  assert.match(component, /data-testid="focus-check-open-preview"/)
  assert.match(main, /'focus-check'/)
  assert.doesNotMatch(component, /tab=|production|Today|App\./)
})

test('focused-check exposes all four gate decisions', () => {
  for (const decision of ['accept', 'repeat', 'defer', 'reject']) assert.match(component, new RegExp(decision))
  assert.match(component, /__ui_lab\/decision/)
})
