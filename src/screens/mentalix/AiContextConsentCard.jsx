import { useEffect, useState } from 'react'

import { ShieldCheck } from 'lucide-react'

import Card from '../../components/ui/Card'
import PillButton from '../../components/ui/PillButton'
import { api } from '../../lib/api'
import { useSynced } from '../../lib/store'
import {
  AI_CONSENT_ALLOW_LABEL,
  AI_CONSENT_CARD_BODY,
  AI_CONSENT_CARD_TITLE,
  AI_CONSENT_SNOOZE_LABEL,
  AI_CONTEXT_PERSONAS,
  aiConsentSnoozeKey,
  canManageAiContext,
  isAiConsentSnoozed,
  readAiConsentEnabled,
} from '../../lib/aiContextConsent'

/*
 * Issue #1169 — карточка согласия в начале разговора с Наблюдателем,
 * Наставником и Спутником. Показывается, только если доступ выключен,
 * «Не сейчас» не нажимали последние 7 дней и в разговоре не было
 * кризисного ответа (его передаёт «Диалог» пропом `hidden`).
 *
 * «Разрешить» включает общий доступ через существующий
 * setContextConsent и отмечает сегодняшний чек-ин, если он есть:
 * выключенное согласие не отдаёт AI ни одной записи, включённое — только
 * отмеченные. «Не сейчас» скрывает карточку на неделю.
 */
export default function AiContextConsentCard({ user, persona, hidden = false }) {
  const userId = user?.id
  const [consent, setConsent] = useState('unknown')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [snoozedAt, setSnoozedAt] = useSynced(aiConsentSnoozeKey(userId), '0')

  const allowed = canManageAiContext(user)

  useEffect(() => {
    if (!allowed) return undefined

    let active = true

    api.mentalix
      .contextConsent(userId)
      .then(payload => {
        if (active) setConsent(readAiConsentEnabled(payload) ? 'on' : 'off')
      })
      .catch(() => {
        // Без ответа сервера карточку не показываем: состояние доступа
        // неизвестно, а предлагать включить уже включённое — обман.
        if (active) setConsent('unknown')
      })

    return () => {
      active = false
    }
  }, [allowed, userId])

  async function allow() {
    if (saving) return

    setSaving(true)
    setError('')

    try {
      await api.mentalix.setContextConsent(userId, true)

      // Сегодняшний чек-ин отмечаем тем же потоком, что и «История»
      // (per-entry consent). Его может не быть — тогда отмечать нечего.
      const today = await api.checkin.today(userId).catch(() => null)
      if (today?.id) {
        await api.mentalix.setCheckinContext(userId, today.id, true).catch(console.error)
      }

      setConsent('on')
    } catch (allowError) {
      console.error(allowError)
      setError('Не удалось включить доступ. Попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  function snooze() {
    setSnoozedAt(String(Date.now()))
  }

  const visible =
    allowed &&
    consent === 'off' &&
    !hidden &&
    AI_CONTEXT_PERSONAS.includes(persona) &&
    !isAiConsentSnoozed(snoozedAt)

  if (!visible) return null

  return (
    <section
      data-testid="ai-consent-card"
      aria-label={AI_CONSENT_CARD_TITLE}
      className="mb-3"
    >
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug text-cream">
              {AI_CONSENT_CARD_TITLE}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{AI_CONSENT_CARD_BODY}</p>
            {error && (
              <p role="status" className="mt-2 text-[12px] leading-relaxed text-muted">
                {error}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PillButton
                variant="light"
                testId="ai-consent-allow"
                onClick={allow}
                disabled={saving}
                className="flex-1"
              >
                {AI_CONSENT_ALLOW_LABEL}
              </PillButton>
              <button
                type="button"
                data-testid="ai-consent-snooze"
                className="mx-glass mx-conversation-retry"
                disabled={saving}
                onClick={snooze}
              >
                {AI_CONSENT_SNOOZE_LABEL}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
