import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { invalidateTodayData } from '../lib/todayDataCache'
import { invalidatePracticesData } from '../lib/practicesDataCache'
import BackButton from '../components/BackButton'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import WebActionBar from '../components/WebActionBar'
import { useMainButton, useBackButton } from '../platform/telegram.hooks'
import { isLinkedWebWriteBlocked, LINKED_WEB_WRITE_NOTICE } from '../lib/webAuthLimits'
import '../components/practices/SceneLayout.css'
import { createPortal } from 'react-dom'
import { useVisualViewportHeight } from '../lib/visualViewport'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import SemanticGlyph from '../components/SemanticGlyph'
import EmptyState from '../components/EmptyState'
import { X } from 'lucide-react'

import PracticeDetail from '../components/PracticeDetail'
function BreakContextSheet({ asceza, onSave, onClose }) {
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const viewportHeight = useVisualViewportHeight()

  /*
   * Системная «Назад» должна закрывать шторку, а не весь экран
   * аскез: стек в telegram.js держит верхний обработчик, поэтому
   * пока шторка открыта — «назад» принадлежит ей.
   */
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

  /*
   * Портал в body обязателен: контейнер контента в App.jsx несёт
   * остаточный transform от анимации, и `fixed` внутри него
   * якорится к контейнеру, а не к экрану. Шторка вылезала не там,
   * где должна.
   */
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

function AscezaCard({ asceza, onLog, onBreak, onDelete, onRestore }) {
  const status = asceza.today_status
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const meta = categoryMeta(asceza.category)

  function handleHeld() {
    const wasUnset = !status

    platform.haptic('medium')

    if (wasUnset) {
      platform.haptic('success')
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 700)
    }

    onLog(asceza.id, 'held')
  }

  function handleBroke() {
    platform.haptic('medium')

    // Если срыв уже отмечен, повторное нажатие снимает отметку,
    // сохраняя прежнее поведение API.
    if (status === 'broke') {
      onLog(asceza.id, 'broke')
      return
    }

    onBreak(asceza)
  }

  return (
    <div
      className={`practice-motion-card practice-detail-card mx-ascezas-contract-card relative rounded-[28px] overflow-y-auto overscroll-contain shrink-0 snap-center w-[84%] border p-5 flex flex-col ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${
        status === 'broke' ? 'bg-emerald-light/40 border-cream/12' : 'bg-emerald border-cream/12'
      }`}
    >
      {/* серия — вверху, там её ищут глазами первой */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <StreakBar streak={asceza.streak} tone="mint" />

        <span className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Удалить аскезу «${asceza.name}»`}
            className="practice-scene__choice text-faint text-[13px] leading-none px-1"
          >
            ×
          </button>
        </span>
      </div>

      {confirming && (
        <DeleteConfirmationDialog
          itemType="аскезу"
          itemName={asceza.name}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            platform.haptic('rigid')
            onDelete(asceza.id)
          }}
        />
      )}

      {/*
       * Верхняя треть — рисунок своей категории. Общий жест у
       * всех пяти один: коридор из двух прямых, внутри порядок,
       * снаружи тот же материал в беспорядке.
       */}
      <div
        className={`-mx-[var(--mx-screen-x)] shrink-0 min-h-0 mt-3 bg-artbed border-0 mx-practice-detail-art mx-ascezas-contract-art ${
          status === 'held' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <SemanticGlyph kind={semanticKindForAsceza(asceza)} className="w-full h-full" />
      </div>

      <div className="mt-4 mx-ascezas-contract-title">
        <div className="font-display text-[18px] text-cream leading-tight">{asceza.name}</div>

        <div className="text-[10px] text-muted mb-3">{meta.label}</div>

        {asceza.reason && <p className="text-[11px] text-muted mb-2">{asceza.reason}</p>}

        <div className="flex gap-2 mt-3 mx-ascezas-contract-actions">
          <button
            onClick={handleHeld}
            className={`practice-scene__choice flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 flex items-center justify-center gap-1.5 ${
              status === 'held' ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted'
            }`}
          >
            <Shield size={13} />
            Удержался
          </button>

          <button
            onClick={handleBroke}
            className={`practice-scene__choice flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 flex items-center justify-center gap-1.5 ${
              status === 'broke' ? 'bg-cream/15 text-cream' : 'bg-cream/5 text-muted'
            }`}
          >
            <ShieldOff size={13} />
            Сорвался
          </button>
        </div>

        {status === 'broke' && asceza.today_break_trigger && (
          <p className="text-[11px] text-muted mt-3">Причина: {asceza.today_break_trigger}</p>
        )}

        {status === 'broke' && asceza.today_break_note && (
          <p className="text-[11px] text-muted mt-1 leading-relaxed">{asceza.today_break_note}</p>
        )}

        {status === 'broke' && asceza.replacement && (
          <p className="text-[11px] text-muted mt-2">Замена: {asceza.replacement}</p>
        )}

        {!status && asceza.trigger && (
          <p className="text-[11px] text-faint mt-2 italic">Триггер: {asceza.trigger}</p>
        )}

        <button
          onClick={() => onRestore(asceza)}
          className="practice-scene__choice w-full py-2 mt-3 text-[11px] text-muted border-0"
        >
          Восстановить пропущенный день
        </button>
      </div>
    </div>
  )
}

function CreateAscezaScreen({ onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return e => {
      setDraft(current => ({
        ...current,
        [field]: e.target.value,
      }))
    }
  }

  const { style: surfaceStyle } = useFullscreenSurface()

  /*
   * Действие живёт в системной кнопке: она остаётся над
   * клавиатурой, а форма здесь целиком из полей ввода.
   */
  async function submit() {
    if (!draft.name.trim() || saving) return

    setSaving(true)
    setError(null)

    try {
      const result = await onCreate(draft)
      if (result?.error === 'linked_web_blocked') {
        setError(
          'Открой Mentalix в Telegram, чтобы принять аскезу — привязанному аккаунту это пока доступно только там.'
        )
      } else if (!result) {
        setError('Не получилось сохранить аскезу. Проверь соединение и попробуй ещё раз.')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-emerald border border-cream/10 rounded-2xl px-4 py-3.5 text-[16px] text-cream placeholder-muted outline-none focus:border-gold/50 transition-colors'

  useMainButton({
    text: saving ? 'Сохраняю...' : 'Принять аскезу',
    onClick: submit,
    enabled: Boolean(draft.name.trim()) && !saving,
    loading: saving,
  })

  const webAction = {
    text: saving ? 'Сохраняю...' : 'Принять аскезу',
    onClick: submit,
    disabled: !draft.name.trim() || saving,
  }

  /*
   * Создание аскезы — сфокусированный сценарий с формой и
   * клавиатурой, поэтому живёт по общему fullscreen-контракту:
   * занимает весь экран и не борется с нижней навигацией.
   */
  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow`} style={surfaceStyle}>
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mx-practice-flow__header px-[var(--mx-screen-x)]`}
      >
        <div className="w-full max-w-md mx-auto">
          <BackButton onClick={onCancel} />
        </div>
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} mx-practice-flow__body practice-form__scroll`}>
        <div className="practice-form__inner w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-col">
          <div className="mb-8">
            <h2 className="font-display text-[24px] font-semibold text-cream lowercase">
              новая аскеза.
            </h2>
          </div>

          <div className="practice-form__fields mb-5">
            <input
              value={draft.name}
              onChange={set('name')}
              placeholder="От чего отказываешься"
              className={inputCls}
            />
            <input
              value={draft.reason}
              onChange={set('reason')}
              placeholder="Зачем — что получишь взамен"
              className={inputCls}
            />
            <input
              value={draft.trigger}
              onChange={set('trigger')}
              placeholder="Что провоцирует (триггер)"
              className={inputCls}
            />
            <input
              value={draft.replacement}
              onChange={set('replacement')}
              placeholder="Чем заменить в момент тяги"
              className={inputCls}
            />
            <input
              value={draft.relapse_cost}
              onChange={set('relapse_cost')}
              placeholder="Цена срыва"
              className={inputCls}
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-red-300 leading-relaxed mb-2">
              {error}
            </p>
          )}
        </div>
      </div>
      <WebActionBar action={webAction} />
    </div>,
    getFullscreenPortalTarget()
  )
}

export default function Ascezas({ user, onBack }) {
  const [ascezas, setAscezas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [breakTarget, setBreakTarget] = useState(null)
  const [selected, setSelected] = useState(null)
  const [writeError, setWriteError] = useState(null)

  useEffect(() => {
    if (!user) return
    api.ascezas
      .list(user.id)
      .then(setAscezas)
      .catch(error => console.error(error))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    document.body.style.overflow = breakTarget ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [breakTarget])

  async function logAsceza(ascezaId, status, breakTrigger = null, breakNote = null) {
    try {
      const updated = await api.ascezas.log(ascezaId, user.id, status, breakTrigger, breakNote)
      const merged = previous => previous.map(asceza => asceza.id === ascezaId ? { ...asceza, ...updated, today_status: updated.today_status || status } : asceza)
      setAscezas(merged)
      setSelected(previous => previous?.id === ascezaId ? { ...previous, ...updated, today_status: updated.today_status || status } : previous)
      setWriteError(null)
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
      throw error
    }
  }

  async function createAsceza(draft) {
    try {
      const asceza = await api.ascezas.create(user.id, draft)
      setAscezas(previous => [...previous, asceza])
      setShowCreate(false)
      return asceza
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) return { error: 'linked_web_blocked' }
      return null
    }
  }

  async function deleteAsceza(ascezaId) {
    try {
      await api.ascezas.remove(ascezaId)
      setAscezas(previous => previous.filter(asceza => asceza.id !== ascezaId))
      setSelected(null)
      setWriteError(null)
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) setWriteError(LINKED_WEB_WRITE_NOTICE)
    }
  }

  if (showCreate) return <CreateAscezaScreen onCreate={createAsceza} onCancel={() => setShowCreate(false)} />
  if (selected) {
    return (
      <>
        <PracticeDetail
          kind="asceza"
          practice={selected}
          onBack={() => setSelected(null)}
          onLog={logAsceza}
          onBreak={setBreakTarget}
          onDelete={deleteAsceza}
        />
        {breakTarget && <BreakContextSheet asceza={breakTarget} onSave={logAsceza} onClose={() => setBreakTarget(null)} />}
      </>
    )
  }

  return (
    <div className="mx-ascezas-screen mx-practice-list-screen w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in">
      <div className="flex items-center gap-3 mb-5 mx-ascezas-screen__header">
        <BackButton onClick={onBack} />
        <h2 className="font-display text-[20px] text-cream lowercase">аскезы.</h2>
      </div>
      <p className="mx-practice-list-screen__intro">от чего ты отказываешься</p>
      {writeError && <p role="alert" className="text-[12px] text-amber-200 mb-4">{writeError}</p>}
      {loading ? <p className="text-muted text-[13px]">Загрузка...</p> : ascezas.length === 0 ? (
        <EmptyState glyph={<SemanticGlyph kind="asceza" className="w-full h-full" />}>
          <h3 className="font-display text-[16px] text-cream mb-1">Аскез пока нет</h3>
          <p className="text-[13px] text-muted mb-4">Выбери одну привычку и назови её честно.</p>
          <button onClick={() => setShowCreate(true)} className="cta-pill px-9 py-3.5 text-[13px]">Принять аскезу</button>
        </EmptyState>
      ) : (
        <div className="mx-practice-grid" data-testid="practice-grid">
          {ascezas.map(asceza => (
            <button
              type="button"
              key={asceza.id}
              className={`mx-practice-tile ${asceza.today_status === 'held' ? 'is-done' : ''}`}
              data-testid="practice-tile"
              data-done={asceza.today_status === 'held'}
              onClick={() => { platform.haptic('light'); setSelected(asceza) }}
            >
              <span className="mx-practice-tile__glyph"><SemanticGlyph kind="asceza" className="w-full h-full" /></span>
              <span className="mx-practice-tile__name">{asceza.name}</span>
            </button>
          ))}
        </div>
      )}
      {!loading && <button type="button" className="mx-practice-list-screen__create" onClick={() => setShowCreate(true)}>+ Новая аскеза</button>}
    </div>
  )
}
