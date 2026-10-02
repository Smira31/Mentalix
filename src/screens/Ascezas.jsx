import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { invalidateTodayData } from '../lib/todayDataCache'
import { invalidatePracticesData } from '../lib/practicesDataCache'
import { useBackButton } from '../platform/telegram.hooks'
import { isLinkedWebWriteBlocked, LINKED_WEB_WRITE_NOTICE } from '../lib/webAuthLimits'
import { useVisualViewportHeight } from '../lib/visualViewport'
import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import PracticeListFlow from '../components/practices/PracticeListFlow'

const BREAK_TRIGGERS = ['Стресс', 'Скука', 'Усталость', 'Тревога', 'Компания', 'Импульс', 'Другое']

function BreakContextSheet({ asceza, onSave, onClose }) {
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const viewportHeight = useVisualViewportHeight()

  useBackButton(onClose)

  async function submit() {
    if (!trigger || saving) return
    setSaving(true)
    try {
      const result = await onSave(asceza.id, 'broke', trigger, note.trim() || null)
      if (result?.error === 'linked_web_blocked') {
        setError(LINKED_WEB_WRITE_NOTICE)
        return
      }
      platform.haptic('warning')
      onClose()
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
        className="mx-practice-sheet relative z-10 w-full max-w-sm max-h-[88dvh] rounded-t-[32px] bg-emerald border border-cream/10 px-[var(--mx-screen-x)] pt-3 pb-8 animate-fade-in flex flex-col overflow-hidden"
        style={viewportHeight ? { maxHeight: `min(88dvh, ${viewportHeight}px)` } : undefined}
      >
        <div className="shrink-0 w-10 h-1 rounded-full bg-cream/20 mx-auto mb-5" />
        <div className="shrink-0 flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
              Аскеза
            </p>
            <h2 className="font-display text-[22px] leading-tight text-cream">Что произошло?</h2>
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
            Ты сорвался с «{asceza.name}». Не ругаем себя — фиксируем контекст, чтобы Mentalix смог
            увидеть закономерность.
          </p>
          <p className="text-[11px] text-muted mb-2">Что сильнее всего повлияло?</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {BREAK_TRIGGERS.map(item => {
              const active = trigger === item
              return (
                <button
                  key={item}
                  onClick={() => {
                    platform.haptic('light')
                    setTrigger(item)
                  }}
                  className={`practice-scene__choice py-3 px-3 rounded-2xl border text-[12px] font-semibold ${
                    active
                      ? 'bg-gold text-emerald-deep border-gold'
                      : 'bg-cream/5 text-muted border-cream/10'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
          <label className="block text-[11px] text-muted mb-2">Хочешь добавить пару слов?</label>
          <PracticeWritingCanvas
            value={note}
            onChange={setNote}
            question="Хочешь добавить пару слов?"
            placeholder="Например: вернулся после тяжёлого дня и автоматически открыл Reels"
            ariaLabel="Комментарий к срыву"
            autoFocus
            submitLabel="Сохранить"
            submitDisabled={!trigger || saving}
            onSubmit={submit}
          />
          {asceza.replacement && (
            <div className="mt-4 rounded-2xl bg-mint/5 border border-mint/10 px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Ты заранее выбрал замену</p>
              <p className="text-[13px] text-cream">{asceza.replacement}</p>
            </div>
          )}
          {error && (
            <p role="alert" className="text-[12px] text-amber-200 mt-3 leading-relaxed">
              {error}
            </p>
          )}
          <p className="text-[11px] text-center text-faint mt-3">Срыв — это данные, а не провал.</p>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}

const WRITE_FAILED_NOTICE = 'Не получилось сохранить. Проверь соединение и попробуй ещё раз.'

export default function Ascezas({ user, onBack }) {
  const [ascezas, setAscezas] = useState([])
  const [loading, setLoading] = useState(true)
  const [breakTarget, setBreakTarget] = useState(null)
  const [writeError, setWriteError] = useState(null)

  const [loadError, setLoadError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!user) return undefined
    let alive = true
    api.ascezas
      .list(user.id)
      .then(list => {
        if (!alive) return
        setAscezas(list)
        setLoadError(false)
      })
      .catch(error => {
        console.error(error)
        if (alive) setLoadError(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [user, retryToken])

  function retryLoad() {
    setLoadError(false)
    setLoading(true)
    setRetryToken(n => n + 1)
  }



  useEffect(() => {
    document.body.style.overflow = breakTarget ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [breakTarget])

  async function logAsceza(
    ascezaId,
    status,
    breakTrigger = null,
    breakNote = null,
    restoreDaysAgo = null
  ) {
    try {
      const updated = await api.ascezas.log(
        ascezaId,
        user.id,
        status,
        breakTrigger,
        breakNote,
        restoreDaysAgo
      )
      setWriteError(null)
      setAscezas(previous =>
        previous.map(a =>
          a.id === ascezaId
            ? {
                ...a,
                ...updated,
                // Восстановленный вчерашний день не отмечает сегодняшний.
                ...(restoreDaysAgo === null
                  ? { today_status: updated.today_status ?? status }
                  : {}),
              }
            : a
        )
      )
      invalidateTodayData(user.id)
      invalidatePracticesData(user.id)
      if (breakTarget?.id === ascezaId) setBreakTarget(null)
      return updated
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) {
        setWriteError(LINKED_WEB_WRITE_NOTICE)
        return { error: 'linked_web_blocked' }
      }
      setWriteError(WRITE_FAILED_NOTICE)
      throw error
    }
  }

  // Восстановление пропущенного дня: день держался, срыва в нём не было.
  async function restoreAsceza(ascezaId, { restoreDaysAgo }) {
    return logAsceza(ascezaId, 'held', null, null, restoreDaysAgo)
  }

  async function createAsceza(draft) {
    try {
      const asceza = await api.ascezas.create(user.id, draft)
      setAscezas(previous => [...previous, asceza])
      return asceza
    } catch (error) {
      console.error(error)
      setWriteError(isLinkedWebWriteBlocked(user, error) ? LINKED_WEB_WRITE_NOTICE : WRITE_FAILED_NOTICE)
      return null
    }
  }

  async function updateAsceza(ascezaId, patch) {
    try {
      const updated = await api.ascezas.update(ascezaId, user.id, patch)
      setWriteError(null)
      setAscezas(previous => previous.map(a => (a.id === ascezaId ? { ...a, ...updated } : a)))
      invalidateTodayData(user.id)
      invalidatePracticesData(user.id)
      return updated
    } catch (error) {
      console.error(error)
      setWriteError(isLinkedWebWriteBlocked(user, error) ? LINKED_WEB_WRITE_NOTICE : WRITE_FAILED_NOTICE)
      return null
    }
  }

  async function deleteAsceza(ascezaId) {
    try {
      await api.ascezas.remove(ascezaId)
      setAscezas(previous => previous.filter(a => a.id !== ascezaId))
      setWriteError(null)
    } catch (error) {
      console.error(error)
      setWriteError(isLinkedWebWriteBlocked(user, error) ? LINKED_WEB_WRITE_NOTICE : WRITE_FAILED_NOTICE)
    }
  }

  return (
    <PracticeListFlow
      kind="asceza"
      items={ascezas}
      loading={loading}
      loadError={loadError}
      onRetry={retryLoad}
      onLog={logAsceza}
      onCreate={createAsceza}
      onUpdate={updateAsceza}
      onDelete={deleteAsceza}
      onRestore={restoreAsceza}
      onBack={onBack}
      onBreak={setBreakTarget}
      breakSheet={
        breakTarget ? (
          <BreakContextSheet
            asceza={breakTarget}
            onSave={logAsceza}
            onClose={() => setBreakTarget(null)}
          />
        ) : null
      }
      writeError={writeError}
    />
  )
}
