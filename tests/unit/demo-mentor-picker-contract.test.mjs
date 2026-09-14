import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const picker = await readFile(
  new URL('../../src/screens/mentalix/PersonaPicker.jsx', import.meta.url),
  'utf8'
)

test('PR #565: Demo Mentor card uses approved copy without changing the baseline picker', () => {
  assert.match(picker, /import \{ isPreviewDemoMode \} from '\.\.\/\.\.\/lib\/demoMode'/)
  assert.match(picker, /const previewDemoMode = isPreviewDemoMode\(\)/)
  assert.match(
    picker,
    /const useDemoMentorCopy = previewDemoMode && persona\.key === 'kompas'/
  )
  assert.match(
    picker,
    /const promise = useDemoMentorCopy \? persona\.tagline : PROMISES\[persona\.key\]/
  )
  assert.match(
    picker,
    /const description = useDemoMentorCopy \? persona\.desc : DIALOG_DESCRIPTIONS\[persona\.key\]/
  )
})
