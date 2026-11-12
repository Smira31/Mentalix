import { useCallback, useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { fetchHistory, invalidateHistory } from '../lib/mentalixHistoryCache'
import { useTabRefresh } from '../lib/tabRefresh'
import { mergeConversationMessages } from '../lib/mentalixConversationUtils'
import { mskDayKey, msUntilNextMskMidnight } from '../lib/mskDate'

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
import './mentalix/DialogNotice.css'

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

/*
 * Черновик поля ввода — по conversation_id, чтобы при возврате
 * в разговор текст не терялся. sessionStorage переживает перезагрузку
 * в пределах сессии вкладки и не утекает между разговорами.
 */
const CHAT_DRAFT_PREFIX = 'mx-mentor-chat-draft-v1'

function readChatDraft(conversationId) {
  if (!conversationId) return null
  try {
    return sessionStorage.getItem(`${CHAT_DRAFT_PREFIX}:${conversationId}`)
  } catch {
    return null
  }
}

function writeChatDraft(conversationId, value) {
  if (!conversationId) return
  try {
    const key = `${CHAT_DRAFT_PREFIX}:${conversationId}`
    if (value) sessionStorage.setItem(key, value)
    else sessionStorage.removeItem(key)
  } catch {
    /* Черновик не критичен — чат работает и без sessionStorage. */
  }
}

// Создание разговора не должно висеть вечно: по таймауту чат
// показывает ошибку с «Повторить», оставаясь смонтированным.
const CONVERSATION_CREATE_TIMEOUT_MS = 12_000

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
  creatingConversation = false,
  creationError = '',
  onRetryCreate = null,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(() => readChatDraft(conversationId) ?? initialText)
  const [loading, setLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [historyAttempt, setHistoryAttempt] = useState(0)
  const [sending, setSending] = useState(false)
  const [dailyLimit, setDailyLimit] = useState(false)
  const initialPromptSent = useRef(false)
  const handoffRef = useRef(initialHandoff)
  const localMessageSequence = useRef(0)
  // conversationId из ответа send — используется для последующих отправок,
  // не вызывает ре-рендер (хранится в ref).
  const conversationIdRef = useRef(conversationId)
  // День МСК, в который упёрлись в дневной лимит, — чтобы сбросить его
  // в полночь по Москве, а не через произвольный интервал.
  const dailyLimitDayRef = useRef(null)
  const userId = user?.id

  const setDraftInput = useCallback(
    value => {
      setInput(value)
      writeChatDraft(conversationIdRef.current, value)
    },
    [setInput]
  )

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    setLoading(true)
    setHistoryError(false)

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
        if (cancelled) return
        if (isGuestAiForbidden(error)) {
          onGuestForbidden?.()
          return
        }
        // Ошибка загрузки — отдельное состояние, не пустая история.
        setHistoryError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // The request is scoped to stable userId/persona inputs, not the mutable user object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    persona,
    viaHandoff,
    withSafetyNotice,
    refreshSignal,
    conversationId,
    historyAttempt,
  ])

  /*
   * Доставка одной реплики. Пузырь пользователя держит текст для повтора,
   * поэтому неудача помечает конкретный пузырь, а не весь чат.
   */
  async function deliver(text, visibleText, { appendUser = true } = {}) {
    setSending(true)
    platform.haptic('light')

    let userMessageId = null
    if (appendUser) {
      localMessageSequence.current += 1
      userMessageId = `local-user-${localMessageSequence.current}`
      setMessages(previous => [
        ...previous,
        {
          id: userMessageId,
          role: 'user',
          content: visibleText,
          retryText: text,
          retryVisibleText: visibleText,
        },
      ])
    }

    /*
     * Сообщение никогда не уходит без conversation_id: без него непонятно,
     * в какой разговор его писать. Если разговор не создался на входе
     * (сбой POST /conversations), создаём его здесь; при повторной неудаче
     * помечаем пузырь «Не отправлено» — реплика не теряется молча.
     */
    if (!conversationIdRef.current) {
      try {
        const created = user?.id
          ? await api.mentalix.createConversation(user.id, persona, {
              timeoutMs: CONVERSATION_CREATE_TIMEOUT_MS,
            })
          : null
        conversationIdRef.current = created?.id || null
      } catch {
        conversationIdRef.current = null
      }

      if (!conversationIdRef.current) {
        if (userMessageId) {
          setMessages(previous =>
            previous.map(message =>
              message.id === userMessageId ? { ...message, status: 'failed' } : message
            )
          )
        }
        setSending(false)
        return false
      }
    }

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
      const reply = await api.mentalix.send(
        user.id,
        text,
        persona,
        handoff || null,
        conversationIdRef.current
      )

      // Сохраняем conversationId из ответа для последующих отправок.
      if (reply?.conversationId) conversationIdRef.current = reply.conversationId

      const replyContent = messageContent(reply)
      const safeReply = {
        ...reply,
        content: withSafetyNotice ? withSafetyNote(replyContent) : replyContent,
      }

      setMessages(previous => [...previous, safeReply])
      invalidateHistory(user.id, persona)
      // Успешная отправка — черновик больше не нужен.
      writeChatDraft(conversationIdRef.current, '')
      return true
    } catch (error) {
      console.error(error)
      if (isGuestAiForbidden(error)) {
        onGuestForbidden?.()
        return false
      }

      // 429 daily_limit: пузырь снимаем (сообщение не ушло), текст возвращаем
      // в поле, отправку гасим до смены суток МСК.
      if (
        error?.status === 429 &&
        String(error?.body?.detail || error?.message || '').includes('daily_limit')
      ) {
        if (userMessageId) {
          setMessages(previous => previous.filter(message => message.id !== userMessageId))
        }
        setDraftInput(text)
        dailyLimitDayRef.current = mskDayKey(new Date())
        setDailyLimit(true)
        return false
      }

      // Обычная неудача: статус и «Повторить» — у этого конкретного пузыря.
      if (userMessageId) {
        setMessages(previous =>
          previous.map(message =>
            message.id === userMessageId ? { ...message, status: 'failed' } : message
          )
        )
      }
      return false
    } finally {
      setSending(false)
    }
  }

  async function send(overrideText, displayText = overrideText, { appendUser = true } = {}) {
    const isVoiceMessage = typeof overrideText === 'string'
    const text = (isVoiceMessage ? overrideText : input).trim()
    const visibleText = (typeof displayText === 'string' ? displayText : text).trim() || text

    if (!text || sending) return

    if (!isVoiceMessage) setDraftInput('')
    setDailyLimit(false)

    await deliver(text, visibleText, { appendUser })
  }

  // «Повторить» у конкретного пузыря: убираем неудачную реплику и шлём её снова.
  function retryMessage(message) {
    if (!message || message.status !== 'failed' || sending) return
    const text = message.retryText ?? messageContent(message)
    const visibleText = message.retryVisibleText ?? text
    setMessages(previous => previous.filter(item => item.id !== message.id))
    void deliver(text, visibleText, { appendUser: true })
  }

  // Сброс дневного лимита при смене суток МСК: проверка при возврате
  // на вкладку, в фокусе окна и по таймеру до ближайшей полуночи Москвы.
  useEffect(() => {
    if (!dailyLimit) return undefined

    const checkDay = () => {
      if (!dailyLimitDayRef.current) return
      if (mskDayKey(new Date()) === dailyLimitDayRef.current) return
      dailyLimitDayRef.current = null
      setDailyLimit(false)
    }

    const midnightTimer = window.setTimeout(checkDay, msUntilNextMskMidnight() + 1000)

    window.addEventListener('focus', checkDay)
    document.addEventListener('visibilitychange', checkDay)

    return () => {
      window.clearTimeout(midnightTimer)
      window.removeEventListener('focus', checkDay)
      document.removeEventListener('visibilitychange', checkDay)
    }
  }, [dailyLimit, refreshSignal])

  useEffect(() => {
    if (loading || !initialPrompt || initialPromptSent.current) return
    initialPromptSent.current = true
    void send(initialPrompt, initialDisplayText || initialPrompt)
    // send intentionally remains the local action function for this one-shot handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialPrompt, initialDisplayText])

  return (
    <Conversation
      userId={user.id}
      persona={persona}
      personaMeta={conversationMeta}
      messages={messages}
      input={input}
      setInput={setDraftInput}
      loading={loading}
      sending={sending}
      onSend={send}
      onBack={onBack}
      onNewConversation={onNewConversation}
      contextSlot={contextSlot}
      footerSlot={footerSlot}
      historyError={historyError}
      onRetryHistory={() => setHistoryAttempt(attempt => attempt + 1)}
      onRetryMessage={retryMessage}
      creatingConversation={creatingConversation}
      creationError={creationError}
      onRetryCreate={onRetryCreate}
      dailyLimit={dailyLimit}
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
  const [conversationError, setConversationError] = useState('')
  const [handoffAttempt, setHandoffAttempt] = useState(0)
  const [showAllConversations, setShowAllConversations] = useState(false)

  // Тихий фоновый рефетч истории диалога при возврате на вкладку или из фона
  useTabRefresh('mentor', () => {
    if (user?.id && persona) {
      invalidateHistory(user.id, persona)
      setRefreshSignal(s => s + 1)
    }
  })

  // Хендофф (вечерний разбор, «Обсудить с AI» и др.): создаём НОВЫЙ разговор,
  // чтобы старые темы не смешивались. Пока разговор не создан, чат не открываем:
  // сообщение не должно уйти без conversation_id. Ошибка — экран с «Повторить».
  useEffect(() => {
    if (!pending.persona || !user?.id) return undefined
    let cancelled = false
    setCreatingConversation(true)
    setConversationError('')
    api.mentalix
      .createConversation(user.id, pending.persona, { timeoutMs: CONVERSATION_CREATE_TIMEOUT_MS })
      .then(conv => {
        if (cancelled) return
        if (conv?.id) setConversationId(conv.id)
        else setConversationError('Не удалось начать разговор')
      })
      .catch(() => {
        if (!cancelled) setConversationError('Не удалось начать разговор')
      })
      .finally(() => {
        if (!cancelled) setCreatingConversation(false)
      })
    return () => {
      cancelled = true
    }
  }, [pending.persona, user?.id, handoffAttempt])

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
    setPersona(null)
    setConversationId(null)
    setConversationError('')
    setPending({ persona: null, draft: '', safety: false, handoff: null })
  }, [])

  // «Новый разговор» из чата: создаём новый разговор той же роли.
  // Чат не размонтируем — шапка и «Назад» живые, индикатор внутри чата;
  // по ошибке/таймауту показываем «Не удалось начать разговор» + «Повторить».
  const handleNewConversation = useCallback(() => {
    if (!user?.id || !persona || creatingConversation) return
    platform.haptic('light')
    setCreatingConversation(true)
    setConversationError('')
    api.mentalix
      .createConversation(user.id, persona, { timeoutMs: CONVERSATION_CREATE_TIMEOUT_MS })
      .then(conv => {
        if (conv?.id) {
          setConversationId(conv.id)
          setDraft('')
        } else {
          setConversationError('Не удалось начать разговор')
        }
      })
      .catch(() => setConversationError('Не удалось начать разговор'))
      .finally(() => setCreatingConversation(false))
  }, [user?.id, persona, creatingConversation])

  // «Продолжить разговор»: открыть существующий разговор с историей.
  const handleContinueConversation = useCallback(conv => {
    setPersona(conv.persona)
    setDraft('')
    setConversationError('')
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
        onPick={(key, text, convId) => {
          setDraft(text || '')
          setPersona(key)
          setConversationError('')
          setConversationId(convId || null)
        }}
        onContinueConversation={handleContinueConversation}
        onShowAllConversations={() => setShowAllConversations(true)}
        onOpenDaimon={onOpenDaimon}
      />
    )
  }

  // Создание при входе/хендоффе: чат ещё не открыт. Ошибка — не открываем чат
  // без conversation_id, а показываем «Не удалось начать разговор» + «Повторить».
  if ((creatingConversation || conversationError) && !conversationId) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3"
        style={{ minHeight: '60vh' }}
      >
        {creatingConversation ? (
          <p className="text-muted text-[14px]">Загрузка...</p>
        ) : (
          <>
            <p className="text-muted text-[14px] text-center px-6" data-testid="conversation-start-error">
              Не удалось начать разговор
            </p>
            <button
              type="button"
              data-testid="conversation-start-retry"
              className="mx-glass mx-conversation-retry"
              onClick={() => setHandoffAttempt(attempt => attempt + 1)}
            >
              Повторить
            </button>
          </>
        )}
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
      creatingConversation={creatingConversation}
      creationError={conversationError}
      onRetryCreate={handleNewConversation}
    />
  )
}
