// src/screens/mentalix/AiContextConsentLine.jsx
//
// Приватность — тихая строка в начале «Диалога» с Наблюдателем, Наставником
// и Спутником. Показывается, только если доступ выключен на сервере,
// «Не сейчас» больше не существует, а после кризисного ответа строку
// скрывает «Диалог» пропом `hidden`.
//
// Согласие здесь не включается: «Настроить» открывает существующий
// под-экран Профиля «твои данные.», где в группе «Приватность» стоит
// переключатель и окно согласия.

import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '../../lib/api'
import { useTabRefresh } from '../../lib/tabRefresh'
import {
  AI_CONSENT_LINE_ACTION,
  AI_CONSENT_LINE_TEXT,
  AI_CONTEXT_PERSONAS,
  canManageAiContext,
  readAiConsentEnabled,
} from '../../lib/aiContextConsent'

export default function AiContextConsentLine({ user, persona, hidden = false, onConfigure }) {
  const userId = user?.id
  const allowed = canManageAiContext(user)
  const [consent, setConsent] = useState('unknown')
  const requestRef = useRef(0)

  const refresh = useCallback(() => {
    if (!allowed) return

    const requestId = ++requestRef.current

    api.mentalix
      .contextConsent(userId)
      .then(payload => {
        if (requestRef.current === requestId) {
          setConsent(readAiConsentEnabled(payload) ? 'on' : 'off')
        }
      })
      .catch(() => {
        // Без ответа сервера состояние доступа неизвестно — строку не
        // показываем: «не видят» оказалось бы догадкой.
        if (requestRef.current === requestId) setConsent('unknown')
      })
  }, [allowed, userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  /*
   * Профиль закрывается и отправляет общее событие обновления вкладки:
   * включённое там согласие сразу убирает строку из «Диалога».
   */
  useTabRefresh('mentor', refresh)

  const visible =
    allowed && consent === 'off' && !hidden && AI_CONTEXT_PERSONAS.includes(persona)

  if (!visible) return null

  return (
    <div
      data-testid="ai-consent-line"
      className="mb-3 flex flex-wrap items-center gap-x-1 text-[12px] leading-snug text-muted"
    >
      <span>{AI_CONSENT_LINE_TEXT} ·</span>
      <button
        type="button"
        data-testid="ai-consent-configure"
        onClick={onConfigure}
        className="mx-conversation-retry"
      >
        {AI_CONSENT_LINE_ACTION}
      </button>
    </div>
  )
}
