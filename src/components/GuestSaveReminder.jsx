import { useEffect, useState } from 'react'
import { Cloud, X } from 'lucide-react'
import { platform, platformName } from '../platform'
import { api } from '../lib/api'
import { isDemoGuestMode } from '../lib/demoMode'
import { logEngagementEvent } from '../lib/engagementEvents'
import { readJournalStore } from '../lib/journalStorage'
import { hideGuestSaveReminder, shouldShowGuestSaveReminder } from '../lib/guestSaveReminder'
import './GuestSaveReminder.css'

export default function GuestSaveReminder({ user, hasEntries, onOpenSettings }) {
  const [dismissed, setDismissed] = useState(false)
  const [remoteEntries, setRemoteEntries] = useState(null)

  useEffect(() => {
    if (platformName !== 'web' || !user?.is_guest || hasEntries) return undefined
    let active = true
    Promise.all([
      api.journalTemplates.sessions(user.id, 'completed').catch(() => []),
      api.journey.entries(user.id).catch(() => ({ items: [] })),
    ]).then(([sessions, journey]) => {
      if (active) setRemoteEntries({ userId: user.id, hasEntries: Boolean(sessions?.length || journey?.items?.length) })
    })
    return () => { active = false }
  }, [user?.id, user?.is_guest, hasEntries])

  const localEntries = user?.is_guest && Object.values(readJournalStore(user.id).entries).some(
    entry => entry.freeWrites?.some(item => item.text?.trim()) ||
      Object.values(entry.cycle || {}).some(phase => phase.text?.trim())
  )
  const visible = !dismissed && shouldShowGuestSaveReminder({
    user,
    platformName,
    hasEntries: hasEntries || (remoteEntries?.userId === user?.id && remoteEntries.hasEntries) || localEntries,
    demoGuest: isDemoGuestMode(),
  })

  useEffect(() => {
    if (!visible) return
    logEngagementEvent({
      user, event: 'guest_save_reminder_shown', once: 'display',
      hasSession: Boolean(platform.getSessionToken?.()), send: api.events.log,
    })
  }, [visible, user])

  if (!visible) return null

  return (
    <section className="mx-guest-save-reminder" data-testid="guest-save-reminder" aria-labelledby="guest-save-reminder-title">
      <h2 id="guest-save-reminder-title" className="mx-type-section text-cream">Напоминание</h2>
      <div className="mx-guest-save-reminder__card">
        <button
          type="button"
          className="mx-guest-save-reminder__close mx-tap-target"
          data-testid="guest-save-reminder-close"
          aria-label="Скрыть напоминание на 7 дней"
          onClick={() => {
            hideGuestSaveReminder(user.id)
            setDismissed(true)
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
        <Cloud className="mx-guest-save-reminder__icon" size={32} strokeWidth={1.5} aria-hidden="true" />
        <strong className="mx-type-card text-cream">Твои записи хранятся только в этом браузере</strong>
        <p className="mx-type-list-body text-muted">Сохрани прогресс по email — так ты его не потеряешь</p>
        <button
          type="button"
          className="cta-pill mx-type-control mx-guest-save-reminder__action"
          data-testid="guest-save-reminder-action"
          onClick={() => {
            logEngagementEvent({
              user, event: 'guest_save_reminder_clicked',
              hasSession: Boolean(platform.getSessionToken?.()), send: api.events.log,
            })
            onOpenSettings?.()
          }}
        >
          Сохранить прогресс
        </button>
      </div>
    </section>
  )
}
