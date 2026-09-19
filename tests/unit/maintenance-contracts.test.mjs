import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  AVAILABLE_PRACTICES,
  PRACTICE_KEYS,
  isPracticeAvailable,
} from '../../src/config/practiceAvailability.js'
import { withQuery } from '../../src/lib/apiQuery.js'
import { MOOD_CHECK_CHECKIN_ERROR, shouldShowMoodCheckGate } from '../../src/lib/moodCheckGate.js'
import {
  clearJournalStore,
  hasLegacyJournalData,
  journalStorageKey,
  migrateLegacyJournalToUser,
  readJournalEntry,
  saveJournalPhase,
} from '../../src/lib/journalStorage.js'
import { readJournalHistory } from '../../src/lib/journalHistory.js'
import {
  clearCheckinDraft,
  draftHasContent,
  morningDraftToNote,
  readCheckinDraft,
  saveCheckinDraft,
} from '../../src/lib/checkinDraft.js'

test('allowlist сохраняет доступные практики и активирует Lila entry', () => {
  assert.deepEqual(AVAILABLE_PRACTICES, [
    'lila-discover',
    'rituals',
    'ascezas',
    'first-step',
    'no-blame',
    'narrow-focus',
    'one-finish',
    // Meditation: product decision 2026-09-19 — not ready; «Скоро» in catalog.
    // MXL-525 G6: brain/breathing/focus признаны доступными.
    'brain',
    'breathing',
    'focus',
  ])

  assert.equal(isPracticeAvailable(PRACTICE_KEYS.brain), true)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.breathing), true)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.focus), true)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.meditation), false)
  assert.equal(isPracticeAvailable('unknown-practice'), false)
})

test('MXL-014 публикует короткую текстовую медитацию без backend changes', () => {
  const flow = readFileSync(
    new URL('../../src/screens/MeditationFlow.jsx', import.meta.url),
    'utf8'
  )
  const practices = readFileSync(
    new URL('../../src/screens/Practices.jsx', import.meta.url),
    'utf8'
  )
  const availability = readFileSync(
    new URL('../../src/config/practiceAvailability.js', import.meta.url),
    'utf8'
  )

  assert.match(flow, /5–10 минут/)
  assert.match(flow, /Что сейчас происходит\?/)
  assert.match(flow, /Что из этого зависит от тебя\?/)
  assert.match(flow, /Какой один шаг ты выбираешь\?/)
  assert.match(flow, /Если становится тяжелее, остановись/)
  assert.match(flow, /<SceneLayout/)
  assert.match(flow, /practice-scene--input practice-scene--input-centered/)
  assert.equal((flow.match(/floatingToolbar/g) || []).length, 3)
  assert.match(flow, /<JournalTextarea/)
  // Component remains in tree; entry is gated by allowlist (Скоро).
  assert.match(practices, /MeditationFlow/)
  assert.match(practices, /buildPracticeViewModels\(\{ rituals, ascezas, completedToday \}\)/)
  assert.match(availability, /PRACTICE_KEYS\.meditation/)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.meditation), false)
  assert.doesNotMatch(flow, /api\./)
})
