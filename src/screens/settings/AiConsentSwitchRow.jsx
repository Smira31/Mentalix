// src/screens/settings/AiConsentSwitchRow.jsx
//
// Issue #1169 — переключатель «Доступ ИИ к записям» в группе «Приватность».
// Это единственный переключатель согласия в интерфейсе: карточка в «Диалоге»
// только включает доступ, а выключить его можно здесь и обратно — здесь же.
// Поток прежний: GET/PUT /api/mentalix/consent (api.mentalix.*).

import { useEffect, useState } from 'react'

import { api } from '../../lib/api'
import {
  AI_CONSENT_SWITCH_SUBTITLE,
  AI_CONSENT_SWITCH_TITLE,
  canManageAiContext,
  readAiConsentEnabled,
} from '../../lib/aiContextConsent'

import { ProfileNote, ProfileRow, Toggle } from './ProfileUi'

export default function AiConsentSwitchRow({ user }) {
  const userId = user?.id
  const allowed = canManageAiContext(user)
  const [enabled, setEnabled] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!allowed) return undefined

    let active = true

    api.mentalix
      .contextConsent(userId)
      .then(payload => {
        if (active) setEnabled(readAiConsentEnabled(payload))
      })
      .catch(() => {
        // Без состояния доступа переключатель не рисуем: ложное «включено»
        // обмануло бы сильнее, чем отсутствие строки.
        if (active) setError('Не удалось загрузить настройку. Попробуй ещё раз.')
      })

    return () => {
      active = false
    }
  }, [allowed, userId])

  if (!allowed) return null

  if (enabled === null) {
    return error ? (
      <ProfileNote role="alert" danger testId="profile-ai-consent-error">
        {error}
      </ProfileNote>
    ) : null
  }

  async function toggle(next) {
    if (saving || enabled === null) return

    setSaving(true)
    setError('')

    try {
      await api.mentalix.setContextConsent(userId, next)
      setEnabled(next)
    } catch (saveError) {
      console.error(saveError)
      setError('Настройка не сохранилась. Попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ProfileRow
        title={AI_CONSENT_SWITCH_TITLE}
        subtitle={AI_CONSENT_SWITCH_SUBTITLE}
        subtitleLines={4}
        testId="profile-ai-consent-row"
        right={
          <Toggle
            checked={enabled === true}
            label={AI_CONSENT_SWITCH_TITLE}
            onChange={toggle}
            disabled={saving || enabled === null}
            testId="profile-ai-consent-toggle"
          />
        }
      />
      {error && (
        <ProfileNote role="status" danger testId="profile-ai-consent-save-error">
          {error}
        </ProfileNote>
      )}
    </>
  )
}
