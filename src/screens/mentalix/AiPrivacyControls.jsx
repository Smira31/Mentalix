import { useEffect, useState } from 'react'
import { ShieldCheck, Trash2 } from 'lucide-react'

import { api } from '../../lib/api'

export default function AiPrivacyControls({ userId, onDataDeleted }) {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    api.mentalix.contextConsent(userId)
      .then(data => {
        if (active) setEnabled(Boolean(data?.enabled))
      })
      .catch(() => {
        if (active) setMessage('Не удалось получить настройки контекста.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [userId])

  async function toggleContext() {
    if (saving || loading) return
    const next = !enabled
    setSaving(true)
    setMessage('')
    try {
      await api.mentalix.setContextConsent(userId, next)
      setEnabled(next)
    } catch {
      setMessage('Настройка не сохранилась. Попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  async function clearAiData() {
    if (saving || !window.confirm('Удалить историю этого AI-диалога, сохранённый AI-контекст и оценки? Записи Journal останутся.')) return
    setSaving(true)
    setMessage('')
    try {
      await api.mentalix.deleteData(userId)
      setEnabled(false)
      onDataDeleted?.()
      setMessage('История диалогов и AI-контекст удалены.')
    } catch {
      setMessage('Не удалось удалить AI-данные. Ничего не менялось.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-4 rounded-[20px] border border-cream/10 bg-emerald px-4 py-3" aria-label="Настройки приватности наставника">
      <div className="flex items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-cream">Ответ создаёт AI</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">Контекст Journal не используется без отдельного согласия. AI не заменяет помощь специалиста.</p>
          <button type="button" role="switch" aria-checked={enabled} disabled={loading || saving} onClick={toggleContext} className="mt-3 min-h-10 rounded-full bg-cream/5 px-3 text-left text-[12px] font-semibold text-gold disabled:opacity-50">
            {enabled ? 'Контекст включён — отключить' : 'Разрешить персональный контекст'}
          </button>
        </div>
      </div>
      <button type="button" disabled={saving} onClick={clearAiData} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-[12px] font-semibold text-muted active:text-red-300 disabled:opacity-50">
        <Trash2 size={15} aria-hidden="true" /> Очистить данные AI
      </button>
      {message && <p role="status" className="mt-2 text-[11px] leading-relaxed text-muted">{message}</p>}
    </section>
  )
}
