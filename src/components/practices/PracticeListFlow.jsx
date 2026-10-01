import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { platform } from '../../platform'
import { useBackButton } from '../../platform/telegram.hooks'
import { RoundBackButton } from '../NestedScreenHeader'
import SemanticGlyph, {
  semanticKindForRitual,
  semanticKindForAsceza,
} from '../SemanticGlyph'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../../lib/fullscreenSurface'
import { getFullscreenPortalTarget } from '../../lib/fullscreenSurface'
import PracticeDetail from '../PracticeDetail'
import {
  PRACTICE_WORDING,
  buildOwnDraft,
  buildPresetDraft,
} from '../../lib/practiceWording'
import './PracticeListFlow.css'

/* ── Тост ── */
function FlowToast({ message }) {
  if (!message) return null
  return <div className="mx-practice-flow-toast" role="status">{message}</div>
}

/* ── Стеклянная пилюля в потоке контента ── */
function FlowPill({ children, onClick }) {
  return (
    <button type="button" className="mx-practice-flow-pill" onClick={onClick}>
      {children}
    </button>
  )
}

/* ── Экран списка ── */
function ListScreen({ wording, items, loading, isDone, onToggleTile, onOpenDetail, onBack, onOpenReady }) {
  const doneCount = items.filter(isDone).length
  const total = items.length

  return (
    <div className="mx-practice-flow-screen w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in">
      <div className="mx-practice-flow-screen__header">
        <RoundBackButton onClick={onBack} className="mx-practice-flow-screen__back" />
        <h1 className="mx-practice-flow-screen__title">{wording.title}</h1>
        <p className="mx-practice-flow-screen__subtitle">{wording.subtitle}</p>
      </div>

      {loading ? (
        <p className="text-muted text-[13px] text-center">Загрузка...</p>
      ) : (
        <>
          <p className="mx-practice-flow-screen__today">
            сегодня {doneCount} из {total}
          </p>

          <div className="mx-practice-flow-grid" data-testid="practice-grid">
            {items.map(item => {
              const done = isDone(item)
              const glyph =
                wording.kind === 'ritual'
                  ? semanticKindForRitual(item.name)
                  : semanticKindForAsceza(item)
              const minimum = wording.minimumValue(item)
              return (
                <div
                  key={item.id}
                  className={`mx-practice-flow-tile${done ? ' is-done' : ''}`}
                  data-testid="practice-tile"
                  data-done={done}
                  onClick={() => {
                    platform.haptic('light')
                    onOpenDetail(item)
                  }}
                >
                  <button
                    type="button"
                    className="mx-practice-flow-tile__check"
                    aria-label={done ? 'Снять отметку' : 'Отметить сегодня'}
                    aria-pressed={done}
                    data-testid="practice-tile-check"
                    onClick={e => {
                      e.stopPropagation()
                      platform.haptic('success')
                      onToggleTile(item)
                    }}
                  >
                    <span className="mx-practice-flow-tile__check-circle">
                      <Check />
                    </span>
                  </button>

                  <span className="mx-practice-flow-tile__icon">
                    <SemanticGlyph kind={glyph} className="w-full h-full" />
                  </span>
                  <span className="mx-practice-flow-tile__name">{item.name}</span>
                  <span className="mx-practice-flow-tile__minimum">
                    {minimum || wording.cardMinimumLabel}
                  </span>
                  <span className="mx-practice-flow-tile__status">
                    {wording.statusLabel(item.streak || 0)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && (
        <FlowPill
          onClick={() => {
            platform.haptic('light')
            onOpenReady()
          }}
        >
          + {wording.newLabel}
        </FlowPill>
      )}
    </div>
  )
}

/* ── Экран «готовые» ── */
function ReadyScreen({ wording, items, onAddPreset, onOpenOwn, onBack }) {
  const existingNames = new Set(items.map(i => i.name.toLowerCase()))

  return (
    <div className="mx-practice-ready-screen w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in">
      <div className="mx-practice-flow-screen__header">
        <RoundBackButton onClick={onBack} className="mx-practice-flow-screen__back" />
        <h1 className="mx-practice-flow-screen__title">{wording.readyTitle}</h1>
        <p className="mx-practice-flow-screen__subtitle">{wording.readySubtitle}</p>
      </div>

      <div className="mx-practice-ready-list">
        {wording.presets.map(preset => {
          const added = existingNames.has(preset.name.toLowerCase())
          return (
            <button
              type="button"
              key={preset.name}
              className={`mx-practice-ready-card${added ? ' is-added' : ''}`}
              data-testid="practice-preset-card"
              disabled={added}
              onClick={() => {
                platform.haptic('success')
                onAddPreset(preset)
              }}
            >
              <span className="mx-practice-ready-card__icon">
                <SemanticGlyph kind={preset.glyph} className="w-full h-full" />
              </span>
              <span className="mx-practice-ready-card__body">
                <span className="mx-practice-ready-card__name">{preset.name}</span>
                <span className="mx-practice-ready-card__minimum">
                  {wording.cardMinimumLabel}: {preset.minimum}
                </span>
              </span>
              <span className="mx-practice-ready-card__action">
                {added ? <Check size={20} /> : '+'}
              </span>
            </button>
          )
        })}
      </div>

      <FlowPill
        onClick={() => {
          platform.haptic('light')
          onOpenOwn()
        }}
      >
        {wording.ownPill}
      </FlowPill>
    </div>
  )
}

/* ── Свой — 2 экрана в стиле журнала ── */
function OwnScreen({ wording, onCreate, onCancel }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  useBackButton(onCancel)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [minimum, setMinimum] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const steps = wording.ownSteps
  const current = steps[step]
  const value = step === 0 ? name : minimum
  const setValue = step === 0 ? setName : setMinimum
  const canAdvance = value.trim().length > 0

  useEffect(() => {
    // автофокус — клавиатура открыта сразу
    inputRef.current?.focus()
  }, [step])

  async function advance() {
    if (!canAdvance || saving) return
    if (step === 0) {
      setStep(1)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const draft = buildOwnDraft(wording.kind, name.trim(), minimum.trim())
      const result = await onCreate(draft)
      if (!result) {
        setError('Не получилось сохранить. Проверь соединение и попробуй ещё раз.')
        setSaving(false)
      }
    } catch (e) {
      setError('Не получилось сохранить. Проверь соединение и попробуй ещё раз.')
      setSaving(false)
    }
  }

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow`} style={surfaceStyle}>
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mx-practice-flow__header px-[var(--mx-screen-x)]`}
      >
        <div className="w-full max-w-md mx-auto">
          <RoundBackButton
            onClick={step === 0 ? onCancel : () => setStep(0)}
          />
        </div>
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} mx-practice-flow__body`}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-col pt-4">
          <p className="mx-practice-own-step-label">
            {wording.ownLabel} · {step + 1} / {steps.length}
          </p>
          <div className="mx-practice-own-progress">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`mx-practice-own-progress__bar${i <= step ? ' is-active' : ''}`}
              />
            ))}
          </div>

          <h2 className="mx-practice-own-question">{current.question}</h2>
          <p className="mx-practice-own-hint">{current.hint}</p>

          <input
            ref={inputRef}
            className="mx-practice-own-field"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={step === 0 ? '…' : '…'}
            aria-label={current.question}
            data-testid={`practice-own-input-${step}`}
          />

          {error && (
            <p role="alert" className="text-[13px] text-red-300 leading-relaxed mt-4">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="mx-practice-flow__footer px-[var(--mx-screen-x)] pb-4">
        <div className="w-full max-w-md mx-auto">
          <div className="mx-practice-own-bar">
            <div className="mx-practice-own-chips">
              {current.chips.map(chip => (
                <button
                  type="button"
                  key={chip}
                  className="mx-practice-own-chip"
                  onClick={() => {
                    platform.haptic('light')
                    setValue(chip)
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mx-practice-own-go"
              disabled={!canAdvance || saving}
              aria-label={step === 0 ? 'Далее' : 'Сохранить'}
              data-testid="practice-own-go"
              onClick={advance}
            >
              {step === 0 ? '›' : '✓'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}

/* ── Главный каркас ── */
export default function PracticeListFlow({
  kind,
  items,
  loading,
  onLog,
  onCreate,
  onDelete,
  onBack,
  onBreak,
  breakSheet,
  writeError,
}) {
  const wording = PRACTICE_WORDING[kind]
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  function showToast(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Пустое состояние — сразу экран «готовые», не пустая сетка
  useEffect(() => {
    if (!loading && items.length === 0 && view === 'list') {
      setView('ready')
    }
  }, [loading, items.length, view])

  // onLog(id, value) → возвращает обновлённый объект; синхронизируем selected
  async function handleLog(id, value) {
    const updated = await onLog(id, value)
    if (updated) {
      setSelected(prev => (prev?.id === id ? { ...prev, ...updated } : prev))
    }
  }

  function toggleTile(item) {
    const done = wording.isDone(item)
    const value = done ? wording.unmarkValue(item) : wording.markValue(item)
    handleLog(item.id, value)
  }

  async function addPreset(preset) {
    const draft = buildPresetDraft(kind, preset)
    const result = await onCreate(draft)
    if (result) {
      showToast(wording.addedToast)
      setView('list')
    }
  }

  // back-навигация зависит от текущего вида
  function handleBack() {
    if (view === 'ready') {
      setView(items.length > 0 ? 'list' : 'list')
      return
    }
    onBack()
  }

  if (selected) {
    return (
      <>
        <PracticeDetail
          kind={kind}
          practice={selected}
          onBack={() => setSelected(null)}
          onLog={handleLog}
          onBreak={onBreak}
          onDelete={onDelete}
        />
        {breakSheet}
      </>
    )
  }

  if (view === 'own') {
    return (
      <OwnScreen
        wording={wording}
        onCreate={onCreate}
        onCancel={() => setView('ready')}
      />
    )
  }

  if (view === 'ready') {
    return (
      <ReadyScreen
        wording={wording}
        items={items}
        onAddPreset={addPreset}
        onOpenOwn={() => setView('own')}
        onBack={handleBack}
      />
    )
  }

  return (
    <>
      <ListScreen
        wording={wording}
        items={items}
        loading={loading}
        isDone={wording.isDone}
        onToggleTile={toggleTile}
        onOpenDetail={item => setSelected(item)}
        onBack={onBack}
        onOpenReady={() => setView('ready')}
      />
      <FlowToast message={toast} />
      {writeError && (
        <p role="alert" className="text-[12px] text-amber-200 text-center mt-2 px-[var(--mx-screen-x)]">
          {writeError}
        </p>
      )}
    </>
  )
}
