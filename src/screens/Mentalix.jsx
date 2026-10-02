import { useCallback, useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { fetchHistory, invalidateHistory } from '../lib/mentalixHistoryCache'
import { useTabRefresh } from '../lib/tabRefresh'
import { mergeConversationMessages } from '../lib/mentalixConversationUtils'

import {
  MENTOR_DRAFT_KEY,
  MENTOR_HANDOFF_KEY,
  MENTOR_PERSONA_KEY,
  MENTOR_SAFETY_KEY,
  readPendingMentor,
} from './mentalix/personas'
import { maybeBuildInsightMessage, SURPRISE_MESSAGE_KEY } from './mentalix/insightDigest'
import { AI_REFRAME_LEAD_MESSAGE, withSafetyNote } from '../lib/aiReframeSafety'
import { messageContent } from '../lib/journalPresentation'
import { isGuestUser, resetGuestState, dispatchGuestMerged } from '../lib/guestAuth'

import PersonaPicker from './mentalix/PersonaPicker'
import Conversation from './mentalix/Conversation'
import AllConversationsScreen from './mentalix/AllConversationsScreen'

// ============================================================
// ЭКРАН ГОСТЯ ДЛЯ ИИ
// ============================================================

function isGuestAiForbidden(error) {
  return error?.status === 403 || String(error?.message || '').includes('guest_ai_forbidden')
}

export function GuestAiGate({
  onLogin,
  message = 'Войди, чтобы поговорить с Наблюдателем',
  buttonLabel = 'Войти',
  testId = 'guest-ai-gate',
  buttonTestId = 'guest-ai-login-button',
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-16"
      data-testid={testId}
    >
      <p className="text-cream text-[18px] leading-relaxed max-w-xs">{message}</p>
      <button
        type="button"
        className="mt-6 min-h-11 rounded-full bg-gold px-8 text-[14px] font-semibold text-emerald-deep"
        onClick={onLogin}
        data-testid={buttonTestId}
      >
        {buttonLabel}
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
  conversationId = null,
  initialText = '',
  initialPrompt = null,
  initialDisplayText = null,
  initialHandoff = null,
  initialInsight = null,
  viaHandoff = false,
  withSafetyNotice = false,
  conversationMeta = null,
  contextSlot = null,
  footerSlot = null,
  refreshSignal = 0,
  onBack,
  onGuestForbidden,
  onNewConversation,
  creationError = false,
  onRetryCreation,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialText)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [dailyLimit, setDailyLimit] = useState(false)
  const lastFailedSend = useRef(null)
  const initialPromptSent = useRef(false)
  const handoffRef = useRef(initialHandoff)
  const localMessageSequence = useRef(0)
  // conversationId из ответа send — используется для последующих отправок,
  // не вызывает ре-рендер (хранится в ref).
  const conversationIdRef = useRef(conversationId)
  const userId = user?.id

  useEffect(() => {
    if (!userId || creationError) {
      setLoading(false)
      return
    }

    let cancelled = false

    // Конкретный разговор — через /conversations/{id}/messages;
    // без conversation_id — последний разговор роли (как раньше).
    const historyPromise = conversationIdRef.current
      ? api.mentalix.conversationMessages(conversationIdRef.current, userId)
      : fetchHistory(userId, persona)

    historyPromise
      .then(async history => {
        if (cancelled) return

        const normalized = Array.isArray(history) ? history : []
        let combined = initialInsight
          ? [
              {
                role: 'assistant',
                content: `Кое-что заметил, пока смотрел твои дни. ${initialInsight}`,
              },
              ...normalized,
            ]
          : normalized

        // «Дайджест от Наблюдателя» (ROADMAP.md, идея 3): только при обычном
        // входе в dnevnik, не через openScout()-хендофф вечернего разбора.
        if (persona === 'dnevnik' && !viaHandoff && !conversationIdRef.current) {
          const insight = await maybeBuildInsightMessage(user)

          if (insight && !cancelled) combined = [insight, ...normalized]
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
  }, [userId, persona, viaHandoff, withSafetyNotice, refreshSignal, conversationId, creationError])

  async function send(overrideText, displayText = overrideText, { appendUser = true } = {}) {
    const isVoiceMessage = typeof overrideText === 'string'
    const text = (isVoiceMessage ? overrideText : input).trim()
    const visibleText = (typeof displayText === 'string' ? displayText : text).trim() || text

    if (!text || sending || dailyLimit || creationError) return

    if (!isVoiceMessage) setInput('')
    setSendError('')
    setDailyLimit(false)

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
    const handoff = handoffRef.current
    handoffRef.current = null
    if (handoff) {
      try {
        sessionStorage.removeItem(MENTOR_HANDOFF_KEY)
      } catch {
        // Chat remains usable when sessionStorage is unavailable.
      }
    }

    try {
      const reply = handoff
        ? await api.mentalix.send(user.id, text, persona, handoff, conversationIdRef.current)
        : await api.mentalix.send(user.id, text, persona, null, conversationIdRef.current)

      // Сохраняем conversationId из ответа для последующих отправок.
      if (reply?.conversationId) conversationIdRef.current = reply.conversationId

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
      // 429 daily_limit: спокойная строка, поле неактивно, набранный текст не теряется
      if (
        error?.status === 429 &&
        String(error?.body?.detail || error?.message || '').includes('daily_limit')
      ) {
        if (!isVoiceMessage) setInput(text)
        setDailyLimit(true)
        return
      }
      lastFailedSend.current = { text, visibleText }
      setSendError('Не отправлено ·')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (loading || creationError || !initialPrompt || initialPromptSent.current) return
    initialPromptSent.current = true
    void send(initialPrompt, initialDisplayText || initialPrompt)
    // send intentionally remains the local action function for this one-shot handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, creationError, initialPrompt, initialDisplayText])

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
      onNewConversation={onNewConversation}
      contextSlot={contextSlot}
      footerSlot={footerSlot}
      sendError={sendError}
      dailyLimit={dailyLimit}
      onRetry={retryLastSend}
      creationError={creationError}
      onRetryCreation={onRetryCreation}
    />
  )
}

// ============================================================
// MENTALIX
// ============================================================

export default function MentalixChat({ user, onPersonaChange, onRegisterBack, onOpenDaimon }) {
  const [pending, setPending] = useState(() => readPendingMentor())
  const [surpriseMessage] = useState(() =>
    pending.persona === 'dnevnik' ? sessionStorage.getItem(SURPRISE_MESSAGE_KEY) : null
  )
  const [persona, setPersona] = useState(pending.persona)
  const [draft, setDraft] = useState(pending.draft)
  const [guestForbidden, setGuestForbidden] = useState(false)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [conversationId, setConversationId] = useState(null)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [creationError, setCreationError] = useState(false)
  const [showAllConversations, setShowAllConversations] = useState(false)

  // Тихий фоновый рефетч истории диалога при возврате на вкладку или из фона
  useTabRefresh('mentor', () => {
    if (user?.id && persona) {
      invalidateHistory(user.id, persona)
      setRefreshSignal(s => s + 1)
    }
  })

  // Хендофф (вечерний разбор, «Обсудить с AI» и др.): создаём НОВЫЙ разговор,
  // чтобы старые темы не смешивались. При ошибке ждём явного повтора.
  const handoffConversationCreated = useRef(false)
  useEffect(() => {
    if (!pending.persona || handoffConversationCreated.current || !user?.id) return
    handoffConversationCreated.current = true
    let cancelled = false
    setCreatingConversation(true)
    api.mentalix
      .createConversation(user.id, pending.persona)
      .then(conv => {
        if (!cancelled && conv?.id) setConversationId(conv.id)
      })
      .catch(() => {
        if (!cancelled) setCreationError(true)
      })
      .finally(() => {
        if (!cancelled) setCreatingConversation(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // Read without side effects during render: StrictMode repeats state initializers.
    try {
      sessionStorage.removeItem(MENTOR_PERSONA_KEY)
      sessionStorage.removeItem(MENTOR_DRAFT_KEY)
      sessionStorage.removeItem(MENTOR_SAFETY_KEY)
      sessionStorage.removeItem(SURPRISE_MESSAGE_KEY)
    } catch {
      // The chat also works without sessionStorage.
    }
  }, [])

  const exitConversation = useCallback(() => {
    try {
      sessionStorage.removeItem(MENTOR_HANDOFF_KEY)
    } catch {
      // Leaving the chat must work without sessionStorage.
    }
    setDraft('')
    setCreationError(false)
    setPersona(null)
    setConversationId(null)
    setPending({ persona: null, draft: '', safety: false, handoff: null })
  }, [])

  // «Новый разговор» из чата: создаём новый разговор той же роли.
  const handleNewConversation = useCallback(() => {
    if (!user?.id || !persona) return
    platform.haptic('light')
    setCreatingConversation(true)
    setCreationError(false)
    api.mentalix
      .createConversation(user.id, persona)
      .then(conv => {
        if (conv?.id) {
          setConversationId(conv.id)
          if (!creationError) setDraft('')
        }
      })
      .catch(() => setCreationError(true))
      .finally(() => setCreatingConversation(false))
  }, [user?.id, persona, creationError])

  // «Продолжить разговор»: открыть существующий разговор с историей.
  const handleContinueConversation = useCallback(conv => {
    setCreationError(false)
    setPersona(conv.persona)
    setDraft('')
    setConversationId(conv.id)
    setShowAllConversations(false)
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

  if (showAllConversations) {
    return (
      <AllConversationsScreen
        user={user}
        onSelect={handleContinueConversation}
        onBack={() => setShowAllConversations(false)}
      />
    )
  }

  if (!persona) {
    return (
      <PersonaPicker
        user={user}
        onPick={(key, text, convId, failed = false) => {
          setCreationError(failed)
          setDraft(text || '')
          setPersona(key)
          setConversationId(convId || null)
        }}
        onContinueConversation={handleContinueConversation}
        onShowAllConversations={() => setShowAllConversations(true)}
        onOpenDaimon={onOpenDaimon}
      />
    )
  }

  if (creatingConversation) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <p className="text-muted text-[14px]">Загрузка...</p>
      </div>
    )
  }

  return (
    <ConversationChat
      key={conversationId || 'new'}
      user={user}
      persona={persona}
      conversationId={conversationId}
      initialText={draft}
      initialInsight={surpriseMessage}
      initialHandoff={
        persona === 'dnevnik' && pending.persona === 'dnevnik' ? pending.handoff : null
      }
      viaHandoff={Boolean(pending.persona)}
      withSafetyNotice={Boolean(pending.safety)}
      refreshSignal={refreshSignal}
      onBack={exitConversation}
      onGuestForbidden={() => setGuestForbidden(true)}
      onNewConversation={handleNewConversation}
      creationError={creationError}
      onRetryCreation={handleNewConversation}
    />
  )
}
