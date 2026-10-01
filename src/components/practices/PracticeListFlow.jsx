import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { platform } from '../../platform'
import { RoundBackButton } from '../NestedScreenHeader'
import SemanticGlyph, {
  semanticKindForRitual,
  semanticKindForAsceza,
} from '../SemanticGlyph'
import PracticeDetail from '../PracticeDetail'
import StreakRestoreSheet from '../StreakRestoreSheet'
import { previewPracticeAction } from '../../lib/demoMode'
import {
  PRACTICE_WORDING,
  buildOwnDraft,
  buildPresetDraft,
  isStreakMilestone,
  milestoneDayLabel,
  milestonePhrase,
  restoreChoicesFor,
} from '../../lib/practiceWording'
import PracticeFieldFlow from './PracticeFieldFlow'
import PracticeMilestone from './PracticeMilestone'
import './PracticeListFlow.css'

/* ── Тост ── */
function FlowToast({ message }) {
  if (!message) return null
  return <div className="mx-practice-flow-toast" role="status">{message}</div>
}

/* ── Стеклянная пилюля в потоке контента ── */
function FlowPill({ children, onClick, testId }) {
  return (
    <button
      type="button"
      className="mx-practice-flow-pill"
      data-testid={testId}
      onClick={onClick}
    >
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
          <p className="mx-practice-flow-screen__today" data-testid="practice-today-progress">
            сегодня {doneCount} из {total}
          </p>

          <div className="mx-practice-flow-grid" data-testid="practice-grid">
            {items.map(item => {
              const done = isDone(item)
              const glyph =
                item.glyph ||
                (wording.kind === 'ritual'
                  ? semanticKindForRitual(item.name)
                  : semanticKindForAsceza(item))
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
          testId="practice-new-pill"
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
        testId="practice-own-pill"
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

/* ── Свой — 2 экрана в стиле журнала (общий PracticeFieldFlow) ── */
function OwnScreen({ wording, onCreate, onCancel }) {
  return (
    <PracticeFieldFlow
      label={wording.ownLabel}
      steps={wording.ownSteps}
      onCancel={onCancel}
      onSubmit={values => onCreate(buildOwnDraft(wording.kind, values[0], values[1]))}
    />
  )
}

/* ── Главный каркас ── */
export default function PracticeListFlow({
  kind,
  items,
  loading,
  onLog,
  onCreate,
  onUpdate,
  onDelete,
  onRestore,
  onBack,
  onBreak,
  breakSheet,
  writeError,
}) {
  const wording = PRACTICE_WORDING[kind]
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [milestone, setMilestone] = useState(null)
  const [restoring, setRestoring] = useState(null)
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

  // Демо-ссылка на экран практики: ?demo=1&action=ritual_detail | asceza_detail
  useEffect(() => {
    if (loading || selected || items.length === 0) return
    const wanted = kind === 'ritual' ? 'ritual_detail' : 'asceza_detail'
    if (previewPracticeAction() === wanted) setSelected(items[0])
  }, [loading, items, kind, selected])

  // onLog(id, value) → возвращает обновлённый объект; синхронизируем selected
  async function handleLog(id, value) {
    // Веха 3 / 7 / 21 / 30 — только на отметке, не на снятии.
    const item = items.find(entry => entry.id === id)
    if (item && value != null && !wording.isDone(item)) {
      const nextStreak = (item.streak || 0) + 1
      if (isStreakMilestone(nextStreak)) {
        setMilestone({ streak: nextStreak, name: item.name })
      }
    }
    const updated = await onLog(id, value)
    if (updated) {
      setSelected(prev => (prev?.id === id ? { ...prev, ...updated } : prev))
    }
  }

  // Восстановление пропущенного дня: сервер сам решает, доступно ли оно,
  // и лист показывает его отказ.
  async function handleRestore({ restoreDaysAgo, value }) {
    if (!restoring) return null
    const updated = await onRestore(restoring.id, { restoreDaysAgo, value })
    if (updated) {
      setSelected(prev => (prev?.id === restoring.id ? { ...prev, ...updated } : prev))
    }
    return updated
  }

  // onUpdate(id, patch) → возвращает обновлённый объект; синхронизируем selected
  async function handleUpdate(id, patch) {
    const updated = await onUpdate(id, patch)
    if (updated) {
      setSelected(prev => (prev?.id === id ? { ...prev, ...updated } : prev))
    }
    return updated
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

  const milestoneNode = milestone ? (
    <PracticeMilestone
      streak={milestone.streak}
      dayLabel={milestoneDayLabel(milestone.streak)}
      phrase={milestonePhrase(milestone.streak)}
      name={milestone.name}
      onDone={() => setMilestone(null)}
    />
  ) : null

  if (selected) {
    return (
      <>
        <PracticeDetail
          kind={kind}
          practice={selected}
          onBack={() => setSelected(null)}
          onLog={handleLog}
          onUpdate={handleUpdate}
          onBreak={onBreak}
          onDelete={onDelete}
          onRestore={practice => setRestoring(practice)}
        />
        {restoring && (
          <StreakRestoreSheet
            itemName={restoring.name}
            choices={restoreChoicesFor(kind, restoring)}
            onSave={handleRestore}
            onClose={() => setRestoring(null)}
          />
        )}
        {milestoneNode}
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
      {milestoneNode}
      {writeError && (
        <p role="alert" className="text-[12px] text-amber-200 text-center mt-2 px-[var(--mx-screen-x)]">
          {writeError}
        </p>
      )}
    </>
  )
}
