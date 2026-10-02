import { useEffect, useState } from 'react'

import Screen from '../../components/Screen'
import { api } from '../../lib/api'
import { PERSONAS } from './personas'
import { relativeConversationDate } from './conversationDate'

import './AllConversationsScreen.css'

const PERSONA_NAMES = Object.fromEntries(PERSONAS.map(p => [p.key, p.name]))

export default function AllConversationsScreen({ user, onSelect, onBack }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    api.mentalix
      .listConversations(user.id, { limit: 50 })
      .then(data => {
        if (!cancelled) setConversations(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  return (
    <Screen onBack={onBack} backTestId="all-conversations-back">
      <div className="mx-all-conversations">
        <h1 className="mx-all-conversations__title">все разговоры.</h1>

        {loading && <p className="text-muted text-[14px] text-center pt-4">Загрузка...</p>}

        {!loading && conversations.length === 0 && (
          <p className="text-muted text-[14px] text-center pt-10">Пока нет сохранённых разговоров.</p>
        )}

        {!loading && conversations.length > 0 && (
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
