import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const demoModeSource = await readFile(
  new URL('../../src/lib/demoMode.js', import.meta.url),
  'utf8'
)
const checkinSource = await readFile(
  new URL('../../src/screens/CheckIn.jsx', import.meta.url),
  'utf8'
)

test('demoMode экспортирует прямые превью-ссылки на экраны завершения', () => {
  assert.match(
    demoModeSource,
    /export const DEMO_COMPLETION_ACTIONS = new Set\(\['complete_morning', 'complete_evening'\]\)/
  )
  assert.match(demoModeSource, /export function previewDemoAction\(\)/)
  // Действует только в демо-режиме.
  assert.match(
    demoModeSource,
    /export function previewDemoAction\(\) \{[\s\S]*?if \(!isPreviewDemoMode\(\)\) return null/
  )
})

test('CheckIn переключается на финальный экран по demo action без прохождения потока', () => {
  assert.match(checkinSource, /import \{[^}]*previewDemoAction[^}]*\} from '\.\.\/lib\/demoMode'/)
  assert.match(checkinSource, /function DemoCompletionScreen\(/)
  assert.match(
    checkinSource,
    /const demoAction = previewDemoAction\(\)/
  )
  assert.match(
    checkinSource,
    /demoAction === 'complete_morning'[\s\S]*?<DemoCompletionScreen evening=\{false\}/
  )
  assert.match(
    checkinSource,
    /demoAction === 'complete_evening'[\s\S]*?<DemoCompletionScreen evening/
  )
})

test('DemoCompletionScreen переиспользует общий CheckInCompletion и кнопку возврата', () => {
  const screenStart = checkinSource.indexOf('function DemoCompletionScreen')
  const screenEnd = checkinSource.indexOf('function CheckIn(', screenStart)
  const screen = checkinSource.slice(screenStart, screenEnd)

  assert.match(screen, /<CheckInCompletion\s+evening=\{evening\}/)
  assert.match(screen, /testId: 'checkin-back-to-today'/)
  assert.match(screen, /<WebActionBar action=\{action\} className="mx-completion-action"/)
  assert.match(screen, /getFullscreenPortalTarget\(\)/)
})

console.log('Demo completion preview contract passed')
