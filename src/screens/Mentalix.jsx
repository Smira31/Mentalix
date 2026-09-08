import { useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { fetchHistory, invalidateHistory } from '../lib/mentalixHistoryCache'

import { readPendingMentor } from './mentalix/personas'
import { maybeBuildInsightMessage } from './mentalix/insightDigest'
import { AI_REFRAME_LEAD_MESSAGE, withSafetyNote } from '../lib/aiReframeSafety'

import PersonaPicker from './mentalix/PersonaPicker'
import Conversation from './mentalix/Conversation'
import AiPrivacyControls from './mentalix/AiPrivacyControls'

// ============================================================
// ЧАТ
// ============================================================

export function ConversationChat({
  user,
  persona,
  initialText = '',
  initialPrompt = null,
  initialDisplayText = null,
  viaHandoff = false,
  withSafetyNotice = false,
  conversationMeta = null,
  contextSlot = null,
  footerSlot = null,
  onBack,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialText)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const lastFailedSend = useRef(null)
  const initialPromptSent = useRef(false)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    fetchHistory(user.id, persona)
      .then(async history => {
        if (cancelled) return

        let combined = history

        // «Дайджест от Следопыта» (ROADMAP.md, идея 3): только при обычном
        // входе в dnevnik, не через openScout()-хендофф вечернего разбора.
        if (persona === 'dnevnik' && !viaHandoff) {
          const insight = await maybeBuildInsightMessage(user)

          if (insight && !cancelled) combined = [insight, ...history]
        }

        // MXL-AI-REFRAME-001: лид-дисклеймер только для хендоффа «Обсудить
        // с AI». Ничего не отправляется в backend.
        if (withSafetyNotice && !cancelled) {
          combined = [AI_REFRAME_LEAD_MESSAGE, ...combined]
        }

        if (!cancelled) setMessages(combined)
      })
      .catch(error => {
        console.error(error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, persona, viaHandoff, withSafetyNotice])

  async function send(overrideText, displayText = overrideText, { appendUser = true } = {}) {
    const isVoiceMessage = typeof overrideText === 'string'
    const text = (isVoiceMessage ? overrideText : input).trim()
    const visibleText = String(displayText || text).trim()

    if (!text || sending) return

    if (!isVoiceMessage) setInput('')
    setSendError('')

    if (appendUser) {
      setMessages(previous => [...previous, { role: 'user', content: visibleText }])
    }

    setSending(true)
    platform.haptic('light')

    try {
      const reply = await api.mentalix.send(user.id, text, persona)
      const safeReply = withSafetyNotice
        ? { ...reply, content: withSafetyNote(reply.content) }
        : reply

      setMessages(previous => [...previous, safeReply])
      invalidateHistory(user.id, persona)
      lastFailedSend.current = null
    } catch (error) {
      console.error(error)
      lastFailedSend.current = { text, visibleText }
      setSendError('Не удалось получить ответ. Попробуй ещё раз.')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (loading || !initialPrompt || initialPromptSent.current) return
    initialPromptSent.current = true
    void send(initialPrompt, initialDisplayText || initialPrompt)
  }, [loading, initialPrompt, initialDisplayText])

  function retryLastSend() {
    const failed = lastFailedSend.current
    if (!failed) return
    void send(failed.text, failed.visibleText, { appendUser: false })
  }

  function handleAiDataDeleted() {
    invalidateHistory(user.id, persona)
    setMessages([])
  }

  return (
    <Conversation
      userId={user.id}
      persona={persona}
      personaMeta={conversationMeta}
      messages={messages}
      input={input}
      setInput={setInput}
      loading={loading}
      sending={sending}
      onSend={send}
      onBack={onBack}
      contextSlot={contextSlot}
      footerSlot={footerSlot}
      sendError={sendError}
      onRetry={retryLastSend}
      privacyControls={<AiPrivacyControls userId={user.id} onDataDeleted={handleAiDataDeleted} />}
    />
  )
}

// ============================================================
// MENTALIX
// ============================================================

export default function MentalixChat({ user, onPersonaChange }) {
  const [pending] = useState(() => readPendingMentor())
  const [persona, setPersona] = useState(pending.persona)
  const [draft, setDraft] = useState(pending.draft)

  useEffect(() => {
    onPersonaChange?.(Boolean(persona))
  }, [persona, onPersonaChange])

  useEffect(() => {
    return () => {
      onPersonaChange?.(false)
    }
  }, [onPersonaChange])

  if (!persona) {
    return (
      <PersonaPicker
        user={user}
        onPick={(key, text) => {
          setDraft(text || '')
          setPersona(key)
        }}
      />
    )
  }

  return (
    <ConversationChat
      user={user}
      persona={persona}
      initialText={draft}
      viaHandoff={Boolean(pending.persona)}
      withSafetyNotice={Boolean(pending.safety)}
      onBack={() => {
        setDraft('')
        setPersona(null)
      }}
    />
  )
}
