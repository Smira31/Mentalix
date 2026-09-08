import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { findLilaCard, LILA_DISCOVER_CARDS } from '../../src/data/lilaDiscoverCards.js'

const flow = readFileSync(new URL('../../src/screens/LilaDiscoverFlow.jsx', import.meta.url), 'utf8')
const mentalix = readFileSync(new URL('../../src/screens/Mentalix.jsx', import.meta.url), 'utf8')
const conversation = readFileSync(
  new URL('../../src/screens/mentalix/Conversation.jsx', import.meta.url),
  'utf8'
)
const personas = readFileSync(new URL('../../src/screens/mentalix/personas.js', import.meta.url), 'utf8')

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
  assert.match(dialogBranch, /initialPrompt=\{internalPrompt\}/)
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
