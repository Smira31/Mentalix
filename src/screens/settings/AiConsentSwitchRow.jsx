// src/screens/settings/AiConsentSwitchRow.jsx
//
// Приватность — переключатель «Собеседники видят мои записи» в группе
// «Приватность». Это единственное место, где согласие включается: включение
// открывает окно с честным текстом, выключение срабатывает сразу.
// Поток прежний: GET/PUT /api/mentalix/consent (api.mentalix.*).

import { useEffect, useState } from 'react'

import ConfirmDialog from '../../components/ConfirmDialog'
import { api } from '../../lib/api'
import {
  AI_CONSENT_DIALOG_BODY,
  AI_CONSENT_DIALOG_CANCEL,
  AI_CONSENT_DIALOG_CONFIRM,
  AI_CONSENT_DIALOG_TITLE,
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
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  async function save(next) {
    if (saving) return

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

  /*
   * Включение — только через окно согласия. «Не сейчас», фон и закрытие
   * окна ничего не отправляют: переключатель остаётся выключенным.
   * Выключение ни о чём не спрашивает — это возврат к «не видят».
   */
  function toggle(next) {
    if (saving) return

    if (next) {
      setConfirmOpen(true)
      return
    }

    void save(false)
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
            disabled={saving}
            testId="profile-ai-consent-toggle"
          />
        }
      />
      {error && (
        <ProfileNote role="status" danger testId="profile-ai-consent-save-error">
          {error}
        </ProfileNote>
      )}
      {confirmOpen && (
        <ConfirmDialog
          title={AI_CONSENT_DIALOG_TITLE}
          titleId="ai-consent-dialog-title"
          description={AI_CONSENT_DIALOG_BODY}
          confirmLabel={AI_CONSENT_DIALOG_CONFIRM}
          cancelLabel={AI_CONSENT_DIALOG_CANCEL}
          closeLabel="Закрыть окно согласия"
          testId="ai-consent-dialog"
          onConfirm={() => {
            setConfirmOpen(false)
            void save(true)
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  )
}
