import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../../src/components/MorningPilotCard.jsx', import.meta.url),
  'utf8'
)

// ── React #185: в MorningPilotCard не должно быть setState в теле рендера ──
//
// Раньше при смене userId компонент вызывал setSeenUserId + setDayState
// прямо во время рендера — это могло запускать цикл ре-рендеров.
// Правка перенесла синхронизацию в useEffect.

test('MorningPilotCard: нет паттерна seenUserId/setState в рендере', () => {
  assert.ok(
    !source.includes('seenUserId'),
    'seenUserId убран из MorningPilotCard — нет setState в теле рендера'
  )
})

test('MorningPilotCard: синхронизация dayState при смене userId через useEffect', () => {
  assert.ok(
    source.includes('setDayState(readMorningPilotDay(userId, currentDate))') &&
      source.includes('[userId, currentDate]'),
    'dayState обновляется через useEffect с зависимостью [userId, currentDate]'
  )
})

test('MorningPilotCard: нет setState в теле рендера (if-блок без useEffect)', () => {
  // Паттерн «if (seen !== prop) { setSeen(prop); setState(...) }» в теле
  // компонента — это setState-during-render. Проверяем что такого блока нет.
  assert.ok(
    !/if\s*\(\s*seen\w*\s*!==\s*\w+\s*\)\s*\{[^}]*set\w+\(/.test(source),
    'в теле рендера нет if-блока с setState при смене пропса'
  )
})
