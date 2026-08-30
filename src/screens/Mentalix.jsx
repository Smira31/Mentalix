import { useEffect, useState } from 'react'
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

function Chat({
  user,
  persona,
  initialText = '',
  viaHandoff = false,
  withSafetyNotice = false,
  onBack,
}) {
  const [messages, setMessages] = useState([])

  const [input, setInput] = useState(initialText)

  const [loading, setLoading] = useState(true)

  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    fetchHistory(user.id, persona)
      .then(async history => {
        if (cancelled) return

        let combined = history

        // «Дайджест от Следопыта» (ROADMAP.md, идея 3): только при обычном
        // входе в dnevnik, не через openScout()-хендофф вечернего разбора —
        // они не должны конкурировать за первое сообщение.
        if (persona === 'dnevnik' && !viaHandoff) {
          const insight = await maybeBuildInsightMessage(user)

          if (insight && !cancelled) {
            combined = [insight, ...history]
          }
        }

        // MXL-AI-REFRAME-001: лид-дисклеймер только для хендоффа «Обсудить
        // с AI» (History.jsx) — синтетическое сообщение, тот же приём, что
        // у «Дайджеста от Следопыта» выше. Ничего не отправляется в
        // backend, не персистится, не влияет на обычный вход в чат.
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

  async function send(overrideText) {
    const isVoiceMessage = typeof overrideText === 'string'

    const text = (isVoiceMessage ? overrideText : input).trim()

    if (!text || sending) {
      return
    }

    if (!isVoiceMessage) {
      setInput('')
    }

    setMessages(previous => [
      ...previous,
      {
        role: 'user',
        content: text,
      },
    ])

    setSending(true)
    platform.haptic('light')

    try {
      const reply = await api.mentalix.send(user.id, text, persona)

      // MXL-AI-REFRAME-001: не доверяем сырому выводу модели в этом
      // хендоффе — переиспользует regex-паттерн фильтра MXL-009. Не
      // отбрасывает и не переписывает ответ, только дополняет оговоркой
      // при совпадении с диагностической/причинной/терапевтической
      // формулировкой. Не влияет на обычные чаты (withSafetyNotice=false).
      const safeReply = withSafetyNotice
        ? { ...reply, content: withSafetyNote(reply.content) }
        : reply

      setMessages(previous => [...previous, safeReply])

      invalidateHistory(user.id, persona)
    } catch (error) {
      console.error(error)

      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          content: 'Не удалось получить ответ, попробуй ещё раз.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleAiDataDeleted() {
    invalidateHistory(user.id, persona)
    setMessages([])
  }

  return (
    <Conversation
      userId={user.id}
      persona={persona}
      messages={messages}
      input={input}
      setInput={setInput}
      loading={loading}
      sending={sending}
      onSend={send}
      onBack={onBack}
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

  /*
   * Сообщаем App.jsx,
   * открыта ли конкретная персона.
   *
   * Благодаря этому App сам решает,
   * показывать BottomNavigation или нет.
   */
  useEffect(() => {
    onPersonaChange?.(Boolean(persona))
  }, [persona, onPersonaChange])

  /*
   * Если пользователь уйдёт с вкладки
   * каким-либо внешним способом,
   * navbar не должен остаться скрытым.
   */
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
    <Chat
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
