import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = file => readFile(new URL(`../../${file}`, import.meta.url), 'utf8')

test('демо выносит сегменты из scroll-root, не меняя шапку телефона', async () => {
  const [header, segment, analytics, badges, app, css] = await Promise.all([
    source('src/components/DemoTelegramHeader.jsx'),
    source('src/screens/progress/ProgressSegmentHeader.jsx'),
    source('src/screens/Analytics.jsx'),
    source('src/screens/SeriesBadges.jsx'),
    source('src/App.jsx'),
    source('src/screens/progress/ProgressAnalytics.css'),
  ])
  assert.match(header, /createPortal/)
  assert.match(header, /\[data-mentalix-demo-frame='true'\]\[data-demo-mode='true'\]/)
  assert.match(header, /if \(!frame\) return children/)
  assert.match(header, /if \(!active\) return null/)
  // Сегмент «Прогресса»: демо-рамка — через DemoTelegramHeader, fullscreen —
  // порталом в shell вне .mx-app-scroll-root.
  assert.match(segment, /createPortal/)
  assert.match(segment, /subscribeFullscreen/)
  assert.match(segment, /if \(!fullscreen\) return children/)
  assert.match(segment, /if \(!active\) return null/)
  assert.match(segment, /createPortal\(children, shell\)/)
  assert.match(analytics, /<ProgressSegmentHeader active=\{active\}>/)
  assert.match(app, /active=\{tab === 'trends'\}/)
  assert.match(badges, /<DemoTelegramHeader>/)
  assert.match(badges, /platformName === 'telegram' \|\| isDemoEmulationActive\(\)/)
  assert.doesNotMatch(css, /\[data-mentalix-demo-frame='true'\] \.mx-progress-segment-row/)
})
