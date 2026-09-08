import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { findLilaCard, LILA_DISCOVER_CARDS } from '../../src/data/lilaDiscoverCards.js'
import { normalizeHistory } from '../../src/lib/mentalixHistoryUtils.js'

const flow = readFileSync(new URL('../../src/screens/LilaDiscoverFlow.jsx', import.meta.url), 'utf8')
const mentalix = readFileSync(new URL('../../src/screens/Mentalix.jsx', import.meta.url), 'utf8')
const conversation = readFileSync(
  new URL('../../src/screens/mentalix/Conversation.jsx', import.meta.url),
  'utf8'
)
const personas = readFileSync(new URL('../../src/screens/mentalix/personas.js', import.meta.url), 'utf8')
const presentation = readFileSync(
  new URL('../../src/lib/journalPresentation.js', import.meta.url),
  'utf8'
)
const practices = readFileSync(new URL('../../src/screens/Practices.jsx', import.meta.url), 'utf8')

function between(source, start, end) {
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end, startIndex + start.length)
  assert.notEqual(startIndex, -1, `missing start marker: ${start}`)
  assert.notEqual(endIndex, -1, `missing end marker: ${end}`)
  return source.slice(startIndex, endIndex)
}

test('Lila MVP ships three bounded static discovery cards', () => {
  assert.equal(LILA_DISCOVER_CARDS.length, 3)
  for (const card of LILA_DISCOVER_CARDS) {
    assert.ok(card.id)
    assert.ok(card.topic)
    assert.equal(card.questions.length, 3)
    assert.ok(card.questions.every(question => question.length > 10))
  }
})

test('Lila card lookup is allowlisted and unknown ids are rejected', () => {
  assert.equal(findLilaCard('stuck')?.topic, 'движение')
  assert.equal(findLilaCard('tension')?.topic, 'отношения')
  assert.equal(findLilaCard('direction')?.topic, 'направление')
  assert.equal(findLilaCard('unknown'), null)
})

test('MXL-LILA-UX-001 renders dialog after theme selection with local Lila metadata', () => {
  assert.match(flow, /stage === 'intro'/)
  assert.match(flow, /stage === 'query'/)
  assert.match(flow, /stage === 'theme'/)
  assert.match(flow, /stage === 'dialog'/)
  assert.match(flow, /setStage\('completion'\)/)
  assert.match(flow, /return <Completion/)
  assert.match(flow, /const LILA_CONVERSATION_META = \{[\s\S]*key: 'lila'/)
  assert.doesNotMatch(flow, /PERSONAS\.find\(item => item\.key === 'lila'\)/)

  const themeSelection = between(flow, 'function selectTheme', 'function finishDialog')
  assert.match(themeSelection, /setCardId\(nextCardId\)/)
  assert.match(themeSelection, /setStage\('dialog'\)/)

  const dialogBranch = between(flow, "if (stage === 'dialog' && card)", 'return <Completion')
  assert.match(dialogBranch, /<ConversationChat/)
  assert.match(dialogBranch, /persona="lila"/)
  assert.match(dialogBranch, /conversationMeta=\{LILA_CONVERSATION_META\}/)
  assert.match(dialogBranch, /initialPrompt=\{dialogStarted \? null : internalPrompt\}/)
  assert.match(dialogBranch, /initialDisplayText=\{query\}/)
  assert.match(dialogBranch, /contextSlot=/)
})

test('MXL-LILA-UX-001 keeps the enriched prompt separate from the visible query bubble', () => {
  const dialogBranch = between(flow, "if (stage === 'dialog' && card)", 'return <Completion')
  assert.match(dialogBranch, /Исходный запрос пользователя: \$\{query\}/)
  assert.match(dialogBranch, /Выбранная тема: \$\{card\.topic\}/)
  assert.match(dialogBranch, /Символический контекст карты/)
  assert.match(dialogBranch, /initialDisplayText=\{query\}/)

  assert.match(mentalix, /initialPrompt, initialDisplayText/)
  assert.match(mentalix, /send\(initialPrompt, initialDisplayText \|\| initialPrompt\)/)
})

test('MXL-LILA-UX-001 keeps multi-turn send and no-duplicate retry behavior', () => {
  assert.match(mentalix, /api\.mentalix\.send\(user\.id, text, persona\)/)
  assert.match(mentalix, /onSend=\{send\}/)
  assert.match(mentalix, /send\(failed\.text, failed\.visibleText, \{ appendUser: false \}\)/)
  assert.match(conversation, /contextSlot = null/)
  assert.match(conversation, /footerSlot = null/)
  assert.match(conversation, /sendError = ''/)
  assert.match(conversation, /onRetry/)
})

test('MXL-LILA-UX-001 does not add Lila to the Mentor persona picker', () => {
  assert.deepEqual(
    [...personas.matchAll(/key: '(mayak|kompas|dnevnik)'/g)].map(match => match[1]),
    ['mayak', 'kompas', 'dnevnik']
  )
  assert.doesNotMatch(personas, /key: 'lila'/)
})

test('MXL-LILA-UX-002 normalizes object message content before rendering', () => {
  assert.match(presentation, /export function messageContent\(message\)/)
  assert.match(conversation, /messageContent\(message\)/)
  assert.doesNotMatch(conversation, /String\(message\.content\)/)
})

test('MXL-LILA-UX-002 keeps initial query visible without resending after back/re-enter', () => {
  assert.match(flow, /const \[dialogStarted, setDialogStarted\] = useState\(false\)/)
  assert.match(flow, /initialPrompt=\{dialogStarted \? null : internalPrompt\}/)
  assert.match(flow, /setDialogStarted\(true\)/)
  assert.doesNotMatch(flow, /hideHistory/)
  assert.match(mentalix, /if \(!cancelled\) setMessages\(combined\)/)
  assert.match(mentalix, /send\(initialPrompt, initialDisplayText \|\| initialPrompt\)/)
  assert.match(conversation, /scrollToEnd\(/)
  assert.match(flow, /mx-lila-context/)
})

test('MXL-LILA-UX-003 keeps persistent history visible and scrolls to current context', () => {
  assert.match(mentalix, /fetchHistory\(user\.id, persona\)/)
  assert.match(mentalix, /setMessages\(combined\)/)
  assert.match(conversation, /messages\.length/)
  assert.match(conversation, /scrollToEnd\(firstPosition \? 'auto' : 'smooth'\)/)
})

test('MXL-LILA-UX-003 normalizes repeated history records without changing order', () => {
  const history = [
    { id: 'u-1', role: 'user', content: 'Запрос' },
    { id: 'u-1', role: 'user', content: 'Запрос' },
    { role: 'assistant', content: 'Ответ', created_at: '2026-09-08T10:00:00Z' },
    { role: 'assistant', content: 'Ответ', created_at: '2026-09-08T10:00:00Z' },
    { role: 'user', content: 'Запрос', created_at: '2026-09-08T10:01:00Z' },
  ]
  assert.deepEqual(normalizeHistory(history), [history[0], history[2], history[4]])
  assert.match(readFileSync(new URL('../../src/lib/mentalixHistoryCache.js', import.meta.url), 'utf8'), /inFlight/)
})

test('MXL-LILA-UX-004 keeps retry inline, reuses request text, and suppresses duplicate user bubble', () => {
  assert.match(mentalix, /setSendError\(''\)/)
  assert.match(mentalix, /lastFailedSend\.current = \{ text, visibleText \}/)
  assert.match(mentalix, /send\(failed\.text, failed\.visibleText, \{ appendUser: false \}\)/)
  assert.match(conversation, /role="alert"/)
  assert.match(conversation, />\s*Повторить\s*</)
})

test('MXL-LILA-UX-005 routes completion to Journal and back to the canonical practice catalog', () => {
  assert.match(flow, /onClick=\{onOpenJournal\}/)
  assert.match(flow, /Открыть журнал/)
  assert.match(flow, /Вернуться к практикам/)
  assert.match(practices, /if \(sub === 'lila-discover'\)/)
  assert.match(practices, /onOpenJournal=\{\(\) => setSub\('journal'\)\}/)
  assert.match(practices, /<PracticeCatalogV2/)
})
