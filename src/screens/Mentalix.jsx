import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'

import { readPendingMentor } from './mentalix/personas'

import PersonaPicker from './mentalix/PersonaPicker'
import Conversation from './mentalix/Conversation'


function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

// ============================================================
// ЧАТ
// ============================================================

function Chat({
  user,
  persona,
  initialText = '',
  onBack,
}) {
  const [messages, setMessages] =
    useState([])

  const [input, setInput] =
    useState(initialText)

  const [loading, setLoading] =
    useState(true)

  const [sending, setSending] =
    useState(false)

  useEffect(() => {
    if (!user) return

    api.mentalix
      .history(
        user.id,
        persona,
      )
      .then((history) => {
        setMessages(history)

      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [
    user,
    persona,
  ])


  async function send() {
    const text = input.trim()

    if (
      !text ||
      sending
    ) {
      return
    }

    setInput('')
    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: text,
      },
    ])

    setSending(true)
    haptic('light')

    try {
      const reply =
        await api.mentalix.send(
          user.id,
          text,
          persona,
        )

      setMessages((previous) => [
        ...previous,
        reply,
      ])
    } catch (error) {
      console.error(error)

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            'Не удалось получить ответ, попробуй ещё раз.',
        },
      ])
    } finally {
      setSending(false)
    }
  }


return (
  <Conversation
    persona={persona}
    messages={messages}
    input={input}
    setInput={setInput}
    loading={loading}
    sending={sending}
    onSend={send}
    onBack={onBack}
  />
)
}


// ============================================================
// MENTALIX
// ============================================================

export default function MentalixChat({
  user,
  onPersonaChange,
}) {
  const [pending] = useState(
    () => readPendingMentor(),
  )

  const [persona, setPersona] =
    useState(
      pending.persona,
    )

  const [draft, setDraft] =
    useState(
      pending.draft,
    )


  /*
   * Сообщаем App.jsx,
   * открыта ли конкретная персона.
   *
   * Благодаря этому App сам решает,
   * показывать BottomNavigation или нет.
   */
  useEffect(() => {
    onPersonaChange?.(
      Boolean(persona)
    )
  }, [
    persona,
    onPersonaChange,
  ])


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
        onPick={(
          key,
          text,
        ) => {
          setDraft(
            text || '',
          )

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
      onBack={() => {
        setDraft('')
        setPersona(null)
      }}
    />
  )
}
