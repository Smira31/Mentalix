import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const surfaceSource = await readFile(
  new URL('../../src/lib/fullscreenSurface.js', import.meta.url),
  'utf8'
)
const appSource = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
const cssSource = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8')

test('в demo-рамке высота fullscreen-shell берётся от рамки, а не от окна браузера', () => {
  // портал в demo указывает на рамку устройства
  assert.match(surfaceSource, /data-mentalix-demo-frame/)
  assert.match(surfaceSource, /portalIsDemoFrame/)
  assert.match(surfaceSource, /portalTarget\?\.offsetHeight/)
  // высота shell = высота рамки (окно браузера не используется)
  assert.match(surfaceSource, /demoFrameHeight \?\? \(shellHeight/)
})

test('верхний отступ fullscreen-shell в demo = safe-top + 56 (TG_CONTROLS_HEIGHT)', () => {
  assert.match(
    surfaceSource,
    /tgFullscreen \|\| \(demoMode && portalIsDemoFrame\)[\s\S]*?calc\(var\(--app-safe-top\) \+ \$\{TG_CONTROLS_HEIGHT\}px\)/
  )
})

test('корневой layout в demo-рамке даёт верх = safe-top + 56 для обычных вкладок', () => {
  assert.match(
    appSource,
    /previewDemoMode && !realPhone && deviceFrameMode\s*\?\s*'calc\(var\(--app-safe-top\) \+ 56px\)'/
  )
})

test('CSS demo-рамки эмулирует геометрию iPhone: статус-бар 62/59, низ 34', () => {
  assert.match(cssSource, /\[data-mentalix-demo-frame='true'\]\[data-demo-mode='true'\]/)
  assert.match(cssSource, /--app-safe-top:\s*62px/)
  assert.match(cssSource, /--app-safe-top:\s*59px/)
  assert.match(cssSource, /--app-safe-bottom:\s*34px/)
})
