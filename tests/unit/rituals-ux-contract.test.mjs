import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ritualsSource = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const sceneLayoutSource = await readFile(
  new URL('../../src/components/practices/SceneLayout.css', import.meta.url),
  'utf8'
)

function componentSlice(name, nextName) {
  const start = ritualsSource.indexOf(name)
  const end = ritualsSource.indexOf(`function ${nextName}`, start)
  assert.notEqual(start, -1, `${name} должен существовать`)
  return ritualsSource.slice(start, end === -1 ? undefined : end)
}

test('Ritual card сохраняет flat canonical surface и локальный completed accent', () => {
  const card = componentSlice('RitualCard', 'CreateRitualScreen')

  assert.match(card, /practice-motion-card mx-practice-flow__surface practice-detail-card/)
  assert.match(card, /bg-emerald border-cream\/12/)
  assert.doesNotMatch(card, /\$\{level \? 'bg-gold[^']*'/)
  assert.match(card, /level === 'optimal' \? 'bg-gold'/)
  assert.match(card, /<SemanticGlyph kind=\{semanticKindForRitual\(ritual\.name\)\}/)
  assert.match(card, /Минимум/)
  assert.match(card, /Оптимум/)
  assert.match(card, /Восстановить пропущенный день/)
})

test('Ritual card имеет одну outer border и art-zone без внутренней рамки', () => {
  const card = componentSlice('RitualCard', 'CreateRitualScreen')
  const cardOpening = card.match(/className=\{`([^`]*)\$\{/)?.[1] || ''
  const artOpening = card.match(/className=\{`([^`]*)\$\{\r?\n\s*level/)?.[1] || ''

  assert.match(cardOpening, /border/)
  assert.doesNotMatch(cardOpening, /border-[yt]-/)
  assert.match(artOpening, /bg-artbed/)
  assert.doesNotMatch(artOpening, /border-[yt]-/)
})

test('Rituals screen reserves remaining height for carousel and prevents page scrolling', () => {
  const screen = componentSlice('export default function Rituals', '__missing__')

  assert.match(screen, /mx-rituals-screen w-full max-w-md px-5[^\n]*flex-1 flex flex-col min-h-0 overflow-hidden/)
  assert.match(screen, /mx-rituals-screen__carousel flex gap-3[^\n]*overflow-x-auto[^\n]*flex-1 min-h-0/)
  assert.match(screen, /w-\[84%\]/)
  assert.match(screen, /snap-x snap-mandatory/)
  assert.match(screen, /\[\.\.\.rituals, null\]/)

  assert.match(sceneLayoutSource, /\.mx-rituals-screen \{[\s\S]*?overscroll-behavior-y: none;/)
})

test('Rituals create form retains fullscreen, native BackButton and 16px inputs', () => {
  const form = componentSlice('function CreateRitualScreen', 'export default function Rituals')

  assert.match(form, /useFullscreenSurface\(\)/)
  assert.match(form, /<BackButton onClick=\{onCancel\} \/>/)
  assert.match(form, /text-\[16px\]/)
  assert.match(form, /<WebActionBar action=\{webAction\} \/>/)
  assert.match(form, /useMainButton\(/)
})

// This contract intentionally leaves Telegram/iPhone-only safe-area and native haptics
// behavior to the existing platform-layer/manual gate; it only guards Rituals structure.
assert.match(ritualsSource, /platform\.haptic\('success'\)/)
assert.match(ritualsSource, /setCelebrate\(true\)/)
assert.match(ritualsSource, /onDelete=\{deleteRitual\}/)
assert.match(ritualsSource, /onRestore=\{setRestoreTarget\}/)
assert.match(ritualsSource, /onClick=\{onBack\}/)
assert.match(ritualsSource, /useMainButton\(/)
assert.match(ritualsSource, /<StreakRestoreSheet/)
assert.match(ritualsSource, /role="alert"/)
assert.match(ritualsSource, /Загрузка\.\.\./)
assert.match(ritualsSource, /Ритуалов пока нет/)
assert.match(ritualsSource, /pagination|active/)

export {}

// Keep the module-level assertions above as part of the same contract test file.
// They cover loading, empty, populated, write-error, restore and return-to-Practices paths.
void test
void assert
void ritualsSource
void sceneLayoutSource
void componentSlice

test('Rituals state contract includes loading, empty, populated, error, restore and return paths', () => {
  assert.match(ritualsSource, /loading \?/)
  assert.match(ritualsSource, /rituals\.length === 0 \?/)
  assert.match(ritualsSource, /rituals\.map\(r =>/)
  assert.match(ritualsSource, /writeError &&/)
  assert.match(ritualsSource, /restoreTarget &&/)
  assert.match(ritualsSource, /<BackButton onClick=\{onBack\}/)
})
