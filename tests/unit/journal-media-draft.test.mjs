import assert from 'node:assert/strict'
import test from 'node:test'

import { createPendingMediaDraft, mayUploadPendingMedia, validateJournalMedia } from '../../src/lib/journalMediaDraft.js'

const audio = { name: 'voice.webm', type: 'audio/webm', size: 1024 }

test('journal media принимает поддерживаемый audio только как pending consent draft', () => {
  const draft = createPendingMediaDraft(audio, 'audio')
  assert.equal(draft.status, 'pending_consent')
  assert.equal(mayUploadPendingMedia(draft, false), false)
  assert.equal(mayUploadPendingMedia(draft, true), true)
})

test('journal media отклоняет неподдерживаемый формат и слишком большой файл до upload', () => {
  assert.equal(validateJournalMedia({ type: 'application/pdf', size: 10 }, 'audio').ok, false)
  assert.equal(validateJournalMedia({ type: 'audio/webm', size: 11 * 1024 * 1024 }, 'audio').ok, false)
})
