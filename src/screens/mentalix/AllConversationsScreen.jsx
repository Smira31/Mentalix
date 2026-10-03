import { useEffect, useState } from 'react'

import Screen from '../../components/Screen'
import { api } from '../../lib/api'
import { PERSONAS } from './personas'
import { relativeConversationDate } from './conversationDate'

import './AllConversationsScreen.css'
import './DialogNotice.css'

const PERSONA_NAMES = Object.fromEntries(PERSONAS.map(p => [p.key, p.name]))

export default function AllConversationsScreen({ user, onSelect, onBack }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    api.mentalix
      .listConversations(user.id, { limit: 50 })
      .then(data => {
        if (cancelled) return
        setConversations(Array.isArray(data) ? data : [])
        setError(false)
      })
      .catch(() => {
        // Сбой загрузки — отдельное состояние с «Повторить», а не пустой
        // список: иначе ошибка выглядит как «нет сохранённых разговоров».
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, attempt])

  return (
    <Screen onBack={onBack} backTestId="all-conversations-back">
      <div className="mx-all-conversations">
        <h1 className="mx-all-conversations__title">все разговоры.</h1>

        {loading && <p className="text-muted text-[14px] text-center pt-4">Загрузка...</p>}

        {!loading && error && (
          <div
            role="alert"
            data-testid="all-conversations-error"
            className="mx-conversation-notice"
          >
            <span className="text-muted mx-type-body">Не удалось загрузить разговоры</span>
            <button
              type="button"
              data-testid="all-conversations-retry"
              className="mx-glass mx-conversation-retry"
              onClick={() => {
                setLoading(true)
                setAttempt(value => value + 1)
              }}
            >
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <p className="text-muted text-[14px] text-center pt-10">Пока нет сохранённых разговоров.</p>
        )}

        {!loading && !error && conversations.length > 0 && (
          <ul className="mx-conversation-list" data-testid="all-conversations-list">
            {conversations.map(conv => (
              <li key={conv.id}>
                <button
                  type="button"
                  data-testid="conversation-row"
                  className="mx-conversation-row"
                  onClick={() => onSelect(conv)}
                >
                  <span className="mx-conversation-row__persona">
                    {PERSONA_NAMES[conv.persona] || conv.persona}
                  </span>
                  <span className="mx-conversation-row__text">
                    {conv.title || conv.last_message || 'Без сообщений'}
                  </span>
                  <span className="mx-conversation-row__date">
                    {relativeConversationDate(conv.updated_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  )
}
