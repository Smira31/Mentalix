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
  assert.deepEqual(AVAILABLE_PRACTICES, ['lila-discover', 'rituals', 'ascezas', 'mood', 'alter-ego'])

  assert.equal(isPracticeAvailable('unknown-practice'), false)
})

test('withQuery сохраняет порядок и кодирует значения', () => {
  assert.equal(
    withQuery('/mentalix/messages', { user_id: 42, persona: 'mentor & guide' }),
    '/mentalix/messages?user_id=42&persona=mentor+%26+guide'
  )
})

test('withQuery пропускает только null/undefined и не добавляет пустой query', () => {
  assert.equal(withQuery('/articles'), '/articles')
  assert.equal(
    withQuery('/example', { empty: null, missing: undefined, zero: 0, disabled: false }),
    '/example?zero=0&disabled=false'
  )
})
