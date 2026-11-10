// src/screens/settings/EmailLinkRow.jsx
//
// Issue #1189 — строка «Почта для входа» в Профиле → «твои данные.».
// Видна только в Telegram и у настоящего пользователя, при включённом
// VITE_EMAIL_LINK_ENABLED. Состояния: почты нет — «Добавить»; привязана —
// адрес и «Отвязать» с подтверждением. Поток — api.auth.emailLink.
//
// Условие показа: platform.name === 'telegram' && Number(user.id) > 0
// (как canManageAiContext в src/lib/aiContextConsent.js) — в вебе, у гостя
// и в Даймоне строки нет.

import { useEffect, useState } from 'react'

import { platformName } from '../../platform'
import { api } from '../../lib/api'
import {
  EMAIL_LINK_ADD_LABEL,
  EMAIL_LINK_ENABLED,
  EMAIL_LINK_SUBTITLE,
  EMAIL_LINK_TITLE,
  EMAIL_LINK_UNLINK_CONFIRM_TEXT,
  EMAIL_LINK_UNLINK_CONFIRM_TITLE,
  EMAIL_LINK_UNLINK_LABEL,
  canSeeEmailLink,
  emailLinkErrorText,
} from '../../lib/emailLink'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmailLinkScreen from './EmailLinkScreen'
import { ProfileNote, ProfileRow } from './ProfileUi'

export default function EmailLinkRow({ user }) {
  const allowed = canSeeEmailLink({ enabled: EMAIL_LINK_ENABLED, platform: platformName, user })

  // undefined — ответа сервера ещё нет, null — почты нет, строка — адрес.
  const [email, setEmail] = useState(undefined)
  const [unavailable, setUnavailable] = useState(false)
  const [adding, setAdding] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!allowed) return undefined

    let active = true

    api.auth.emailLink
      .get()
      .then(result => {
        if (active) setEmail(result?.email ?? null)
      })
      .catch(loadError => {
        if (!active) return
        // 404 email_link_disabled: привязку выключили на сервере — строки нет.
        if (Number(loadError?.status) === 404) setUnavailable(true)
        else setError(emailLinkErrorText(loadError))
        setEmail(null)
      })

    return () => {
      active = false
    }
  }, [allowed])

  if (!allowed || unavailable || email === undefined) return null

  async function unlink() {
    if (unlinking) return
    setUnlinking(true)
    setError('')
    try {
      await api.auth.emailLink.remove()
      setEmail(null)
    } catch (unlinkError) {
      setError(emailLinkErrorText(unlinkError))
    } finally {
      setUnlinking(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      {/* Адрес — подписью, а не значением справа: длинная почта в узком
          значении обрезалась бы многоточием и не читалась бы целиком. */}
      {email ? (
        <ProfileRow
          title={EMAIL_LINK_TITLE}
          subtitle={email}
          testId="profile-email-link-row"
          right={
            <button
              type="button"
              className="mx-profile-text-button"
              data-testid="profile-email-link-unlink"
              onClick={() => {
                setError('')
                setConfirmOpen(true)
              }}
            >
              {EMAIL_LINK_UNLINK_LABEL}
            </button>
          }
        />
      ) : (
        <ProfileRow
          title={EMAIL_LINK_TITLE}
          subtitle={EMAIL_LINK_SUBTITLE}
          value={EMAIL_LINK_ADD_LABEL}
          onClick={() => {
            setError('')
            setAdding(true)
          }}
          testId="profile-email-link-row"
        />
      )}

      {error && (
        <ProfileNote role="alert" danger testId="profile-email-link-error">
          {error}
        </ProfileNote>
      )}

      {adding && (
        <EmailLinkScreen
          onBack={() => setAdding(false)}
          onLinked={nextEmail => {
            setEmail(nextEmail)
            setAdding(false)
          }}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          title={EMAIL_LINK_UNLINK_CONFIRM_TITLE}
          description={EMAIL_LINK_UNLINK_CONFIRM_TEXT}
          confirmLabel={unlinking ? 'Отвязываем…' : EMAIL_LINK_UNLINK_LABEL}
          closeLabel="Закрыть подтверждение отвязки почты"
          testId="email-link-unlink"
          onConfirm={unlink}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  )
}
