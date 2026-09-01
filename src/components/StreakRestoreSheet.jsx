import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import { useVisualViewportHeight } from '../lib/visualViewport'

const RESTORE_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

function dayLabel(daysAgo) {
  if (daysAgo === 1) return 'Вчера'
  if (daysAgo >= 2 && daysAgo <= 4) return `${daysAgo} дня назад`
  return `${daysAgo} дней назад`
}

export default function StreakRestoreSheet({ itemName, choices, onSave, onClose }) {
  const [restoreDaysAgo, setRestoreDaysAgo] = useState(null)
  const [choice, setChoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const viewportHeight = useVisualViewportHeight()

  useBackButton(onClose)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  async function submit() {
    if (!restoreDaysAgo || !choice || saving) return

    setSaving(true)
    setError(null)

    try {
      const saved = await onSave({ restoreDaysAgo, value: choice })
      if (!saved) {
        setError('Не получилось восстановить день. Проверь соединение и попробуй ещё раз.')
        return
      }
      platform.haptic('success')
      onClose()
    } catch (requestError) {
      console.error(requestError)
      setError('Не получилось восстановить день. Проверь соединение и попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="mx-practice-flow fixed inset-0 z-[100] flex items-end justify-center">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-black/70 border-0"
      />

      <div
        className="mx-practice-sheet relative z-10 w-full max-w-sm max-h-[88dvh] rounded-t-[32px] bg-emerald border border-cream/10 px-5 pt-3 pb-8 animate-fade-in flex flex-col overflow-hidden"
        style={viewportHeight ? { maxHeight: `min(88dvh, ${viewportHeight}px)` } : undefined}
      >
        <div className="shrink-0 w-10 h-1 rounded-full bg-cream/20 mx-auto mb-5" />

        <div className="shrink-0 flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
              Восстановление серии
            </p>
            <h2 className="font-display text-[22px] leading-tight text-cream">
              Вернуть пропущенный день?
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="practice-scene__choice w-10 h-10 rounded-full bg-cream/5 border-0 flex items-center justify-center shrink-0"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        <div className="practice-sheet__body">
          <p className="text-[12px] text-muted leading-relaxed mb-5">
            Выбери один день за последние семь дней для «{itemName}». Будущие даты и сегодняшняя
            отметка не меняются.
          </p>

          <p className="text-[11px] text-muted mb-2">Когда это было?</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {RESTORE_DAY_OPTIONS.map(daysAgo => {
              const active = restoreDaysAgo === daysAgo
              return (
                <button
                  key={daysAgo}
                  onClick={() => {
                    platform.haptic('light')
                    setRestoreDaysAgo(daysAgo)
                  }}
                  className={`practice-scene__choice py-3 px-3 rounded-2xl border text-[12px] font-semibold ${
                    active
                      ? 'bg-gold text-emerald-deep border-gold'
                      : 'bg-cream/5 text-muted border-cream/10'
                  }`}
                >
                  {dayLabel(daysAgo)}
                </button>
              )
            })}
          </div>

          <p className="text-[11px] text-muted mb-2">Как отметить?</p>
          <div className="flex flex-col gap-2">
            {choices.map(option => {
              const active = choice === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    platform.haptic('light')
                    setChoice(option.value)
                  }}
                  className={`practice-scene__choice w-full text-left rounded-2xl px-4 py-3 border ${
                    active
                      ? 'bg-gold text-emerald-deep border-gold'
                      : 'bg-cream/5 text-muted border-cream/10'
                  }`}
                >
                  <span className="block text-[12px] font-semibold">{option.label}</span>
                  {option.description && (
                    <span
                      className={`block text-[11px] leading-snug mt-1 ${active ? 'text-emerald-deep' : 'text-muted'}`}
                    >
                      {option.description}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {error && (
            <p role="alert" className="text-[12px] text-amber-200 mt-3 leading-relaxed">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={!restoreDaysAgo || !choice || saving}
            className="cta-pill w-full py-4 text-[16px] mt-5 disabled:opacity-35"
          >
            {saving ? 'Восстанавливаю...' : 'Подтвердить восстановление'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
