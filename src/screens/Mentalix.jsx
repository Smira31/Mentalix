import { useCallback, useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { fetchHistory, invalidateHistory } from '../lib/mentalixHistoryCache'
import { mergeConversationMessages } from '../lib/mentalixConversationUtils'

import { readPendingMentor } from './mentalix/personas'
import { maybeBuildInsightMessage } from './mentalix/insightDigest'
import { AI_REFRAME_LEAD_MESSAGE, withSafetyNote } from '../lib/aiReframeSafety'
import { messageContent } from '../lib/journalPresentation'
import { isGuestUser, resetGuestState, dispatchGuestMerged } from '../lib/guestAuth'

import PersonaPicker from './mentalix/PersonaPicker'
import Conversation from './mentalix/Conversation'

// ============================================================
// ЭКРАН ГОСТЯ ДЛЯ ИИ
// ============================================================

function isGuestAiForbidden(error) {
  return error?.status === 403 || String(error?.message || '').includes('guest_ai_forbidden')
}

export function GuestAiGate({ onLogin }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-16"
      data-testid="guest-ai-gate"
    >
      <p className="text-cream text-[18px] leading-relaxed max-w-xs">
        Войди, чтобы поговорить со Следопытом
      </p>
      <button
        type="button"
        className="mt-6 min-h-11 rounded-full bg-gold px-8 text-[14px] font-semibold text-emerald-deep"
        onClick={onLogin}
        data-testid="guest-ai-login-button"
      >
        Войти
      </button>
    </div>
  )
}

function handleGuestLogin() {
  resetGuestState()
  dispatchGuestMerged()
}

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
  onGuestForbidden,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialText)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const lastFailedSend = useRef(null)
  const initialPromptSent = useRef(false)
  const localMessageSequence = useRef(0)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    fetchHistory(userId, persona)
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

        if (!cancelled) {
          setMessages(previous => mergeConversationMessages(combined, previous))
        }
      })
      .catch(error => {
        console.error(error)
        if (!cancelled && isGuestAiForbidden(error)) onGuestForbidden?.()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // The request is scoped to stable userId/persona inputs, not the mutable user object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, persona, viaHandoff, withSafetyNotice])

  async function send(overrideText, displayText = overrideText, { appendUser = true } = {}) {
    const isVoiceMessage = typeof overrideText === 'string'
    const text = (isVoiceMessage ? overrideText : input).trim()
    const visibleText = (typeof displayText === 'string' ? displayText : text).trim() || text

    if (!text || sending) return

    if (!isVoiceMessage) setInput('')
    setSendError('')

    if (appendUser) {
      localMessageSequence.current += 1
      setMessages(previous => [
        ...previous,
        {
          id: `local-user-${localMessageSequence.current}`,
          role: 'user',
          content: visibleText,
        },
      ])
    }

    setSending(true)
    platform.haptic('light')

    try {
      const reply = await api.mentalix.send(user.id, text, persona)
      const replyContent = messageContent(reply)
      const safeReply = {
        ...reply,
        content: withSafetyNotice ? withSafetyNote(replyContent) : replyContent,
      }

      setMessages(previous => [...previous, safeReply])
      invalidateHistory(user.id, persona)
      lastFailedSend.current = null
    } catch (error) {
      console.error(error)
      if (isGuestAiForbidden(error)) {
        onGuestForbidden?.()
        return
      }
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
    // send intentionally remains the local action function for this one-shot handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialPrompt, initialDisplayText])

  function retryLastSend() {
    const failed = lastFailedSend.current
    if (!failed) return
    void send(failed.text, failed.visibleText, { appendUser: false })
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
    />
  )
}

// ============================================================
// MENTALIX
// ============================================================

export default function MentalixChat({ user, onPersonaChange, onRegisterBack }) {
  const [pending] = useState(() => readPendingMentor())
  const [persona, setPersona] = useState(pending.persona)
  const [draft, setDraft] = useState(pending.draft)
  const [guestForbidden, setGuestForbidden] = useState(false)

  const exitConversation = useCallback(() => {
    setDraft('')
    setPersona(null)
  }, [])

  useEffect(() => {
    onPersonaChange?.(Boolean(persona))
  }, [persona, onPersonaChange])

  useEffect(() => {
    onRegisterBack?.(persona ? exitConversation : null)

    return () => onRegisterBack?.(null)
  }, [exitConversation, onRegisterBack, persona])

  useEffect(() => {
    return () => {
      onPersonaChange?.(false)
    }
  }, [onPersonaChange])

  // Гость не может использовать ИИ — показываем экран входа вместо чата.
  // 403 guest_ai_forbidden обрабатывается тем же экраном.
  if (isGuestUser(user) || guestForbidden) {
    return <GuestAiGate onLogin={handleGuestLogin} />
  }

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
      onBack={exitConversation}
      onGuestForbidden={() => setGuestForbidden(true)}
    />
  )
}
