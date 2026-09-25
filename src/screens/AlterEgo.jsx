import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil } from 'lucide-react'

import { platform } from '../platform'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import { CheckInQuestion, CheckInNextControls } from './CheckIn'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  getFullscreenPortalTarget,
} from '../lib/fullscreenSurface'
import { isPreviewDemoMode } from '../lib/demoMode'
import { loadAlterEgos, saveAlterEgo, updateAlterEgo, deleteAlterEgo } from '../lib/alterEgoStorage'
import alterEgoMask from '../assets/alter-ego/alter-ego-mask.webp'

import './AlterEgo.css'

const DISCLAIMER = 'Это упражнение для уверенности, не терапия'

/*
 * 6 страниц журнала — как вечерний разбор:
 * каждая страница — отдельный вопрос, сверху заголовок,
 * под ним серая подсказка, ниже свободное поле текста.
 * Имя (страница 2) обязательно, остальное можно пропустить.
 */
const QUESTIONS = [
  {
    key: 'who',
    title: 'Кем ты хочешь быть, когда трудно?',
    hint: 'Опиши его одним-двумя предложениями.',
  },
  { key: 'name', title: 'Как его зовут?', hint: 'Имя, прозвище — как тебе ближе.', short: true },
  { key: 'mindset', title: 'Как он думает и держится?' },
  { key: 'never', title: 'Чего он никогда не делает?' },
  { key: 'when', title: 'Когда ты надеваешь маску?', hint: 'Ситуации, где он тебе нужен.' },
  { key: 'phrase', title: 'Одна фраза, которую он себе говорит.' },
]

const TOTAL_PAGES = QUESTIONS.length

const DEMO_CARDS = [
  {
    id: 'demo-1',
    who: 'Тот, кто не отступает',
    name: 'Командир',
    mindset: 'Думает спокойно, держится прямо, говорит низким голосом',
    never: 'Не извиняется первым, не избегает взгляда',
    when: 'Выступление, трудный разговор',
    phrase: 'Я здесь главный',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'demo-2',
    who: 'Тот, кому тепло с собой',
    name: 'Огонёк',
    mindset: 'Расслабленные плечи, мягкий взгляд, тёплый голос',
    never: 'Не торопит, не давит',
    when: 'Свидание',
    phrase: 'Мне с собой хорошо',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
]

function emptyDraft() {
  return {
    who: '',
    name: '',
    mindset: '',
    never: '',
    when: '',
    phrase: '',
  }
}

/* ── Журнал создания/редактирования (6 страниц) ── */

function AlterEgoJournal({ initialDraft, editingId, onSave, onCancel }) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(initialDraft || emptyDraft())
  const { style: surfaceStyle } = useFullscreenSurface()

  const question = QUESTIONS[step]
  const isLast = step === TOTAL_PAGES - 1
  const isNameStep = question.short
  const canProceed = isNameStep ? draft.name.trim().length > 0 : true

  function handleBack() {
    platform.haptic('light')
    if (step === 0) {
      onCancel()
      return
    }
    setStep(s => s - 1)
  }

  function handleNext() {
    platform.haptic('light')
    if (isLast) {
      onSave(draft)
      return
    }
    setStep(s => s + 1)
  }

  function update(key, value) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const CHECKIN_LONG_CLASS =
    'w-full min-h-full flex-1 px-[var(--mx-screen-x)] pt-4 pb-2 flex flex-col items-center'

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle} data-testid="alter-ego-flow">
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <BackButton onClick={handleBack} />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div key={step} className={`${CHECKIN_LONG_CLASS} mx-checkin-step-enter`}>
          <CheckInQuestion
            title={question.title}
            hint={question.hint}
            headingAs="h2"
            className="w-full text-left"
            headingClassName="font-display text-cream text-[22px] font-bold leading-[1.2]"
            hintClassName="text-[14px] text-muted mt-[6px] text-[15px]"
          />

          <div className="w-full pt-6 flex flex-1 flex-col">
            {isNameStep ? (
              <input
                type="text"
                className="mx-alter-ego__input"
                placeholder="Например, Командир"
                value={draft.name}
                onChange={e => update('name', e.target.value)}
                data-testid="alter-ego-name"
                autoFocus
              />
            ) : (
              <div className="w-full max-w-md mx-auto flex min-h-0 flex-1 flex-col">
                <JournalTextarea
                  value={draft[question.key]}
                  onChange={value => update(question.key, value)}
                  placeholder="Начни писать…"
                  ariaLabel={question.title}
                  testId="alter-ego-text-input"
                  className="min-h-[18rem] flex-1"
                  editorClassName="pb-24"
                  floatingToolbar
                  guidedFlow
                  autoFocus
                  keepFocusOnSubmit
                  submitIcon="arrow"
                  submitLabel={isLast ? 'Сохранить' : 'Далее'}
                  submitTestId="alter-ego-next"
                  onSubmit={handleNext}
                  onDeepen={() => {}}
                  deepenLabel="Пойти глубже"
                  formatting
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isNameStep && <CheckInNextControls onNext={handleNext} disabled={!canProceed} />}
    </div>,
    getFullscreenPortalTarget()
  )
}

/* ── Карточка альтер-эго в списке ── */

function AlterEgoCard({ card, onWear, onRewrite, onDelete }) {
  return (
    <article className="mx-alter-ego__card" data-testid="alter-ego-card">
      <img src={alterEgoMask} alt="" className="mx-alter-ego__character" aria-hidden="true" />
      <h3 className="mx-alter-ego__card-name">{card.name}</h3>
      {card.phrase && <p className="mx-alter-ego__card-phrase">«{card.phrase}»</p>}
      <div className="mx-alter-ego__card-actions">
        <button
          type="button"
          className="mx-alter-ego__card-btn mx-alter-ego__card-btn--primary mx-tap-target"
          data-testid="alter-ego-wear"
          onClick={() => onWear(card)}
        >
          Надеть маску
        </button>
        <button
          type="button"
          className="mx-alter-ego__card-btn mx-alter-ego__card-btn--secondary mx-tap-target"
          data-testid="alter-ego-rewrite"
          onClick={() => onRewrite(card)}
        >
          <Pencil size={16} aria-hidden="true" /> Переписать
        </button>
      </div>
      {onDelete && (
        <button
          type="button"
          className="mx-alter-ego__back mx-tap-target"
          style={{ marginTop: 12, fontSize: 14 }}
          onClick={() => onDelete(card)}
        >
          Удалить
        </button>
      )}
    </article>
  )
}

/* ── Полноэкранный режим «Надеть маску» ── */

function WearMask({ card, onDone, onRewrite }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  useEffect(() => {
    platform.haptic('light')
  }, [])

  return createPortal(
    <div
      className={FULLSCREEN_SHELL_CLASS}
      style={surfaceStyle}
      data-testid="alter-ego-wear-screen"
    >
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <BackButton onClick={onDone} label="Закрыть" />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="mx-alter-ego__wear">
          <img
            src={alterEgoMask}
            alt=""
            className="mx-alter-ego__character mx-alter-ego__character--lg"
            aria-hidden="true"
          />
          <h2 className="mx-alter-ego__wear-name">{card.name}</h2>

          {card.mindset && (
            <div className="mx-alter-ego__wear-rule" data-testid="alter-ego-wear-mindset">
              <span className="mx-alter-ego__wear-label">Как держится</span>
              <p>{card.mindset}</p>
            </div>
          )}

          {card.never && (
            <div className="mx-alter-ego__wear-rule" data-testid="alter-ego-wear-never">
              <span className="mx-alter-ego__wear-label">Чего никогда не делает</span>
              <p>{card.never}</p>
            </div>
          )}

          {card.phrase && (
            <p className="mx-alter-ego__wear-phrase" data-testid="alter-ego-wear-phrase">
              «{card.phrase}»
            </p>
          )}

          <div className="mx-alter-ego__wear-actions">
            <button
              type="button"
              className="mx-alter-ego__wear-btn mx-alter-ego__wear-btn--primary mx-tap-target"
              data-testid="alter-ego-rewrite-from-wear"
              onClick={() => onRewrite(card)}
            >
              Переписать
            </button>
            <button
              type="button"
              className="mx-alter-ego__wear-btn mx-alter-ego__wear-btn--secondary mx-tap-target"
              data-testid="alter-ego-close"
              onClick={onDone}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}

/* ── Главный экран практики ── */

export default function AlterEgo({ user, onBack }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list') // 'list' | 'journal' | 'wear'
  const [editingCard, setEditingCard] = useState(null)
  const [wearCard, setWearCard] = useState(null)
  const demoMode = isPreviewDemoMode()
  const { style: listSurfaceStyle } = useFullscreenSurface()

  const loadCards = useCallback(async () => {
    setLoading(true)
    if (demoMode) {
      setCards(DEMO_CARDS)
      setLoading(false)
      return
    }
    try {
      const list = await loadAlterEgos()
      setCards(list)
    } catch {
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [demoMode])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  async function handleSave(draft) {
    if (demoMode) {
      const saved = {
        ...draft,
        id: editingCard?.id || `demo-${Date.now()}`,
        createdAt: editingCard?.createdAt || Date.now(),
        updatedAt: Date.now(),
      }
      setCards(prev => {
        const without = prev.filter(c => c.id !== saved.id)
        return [saved, ...without]
      })
      setEditingCard(null)
      setMode('list')
      return
    }
    try {
      if (editingCard) {
        const updated = await updateAlterEgo(editingCard.id, draft)
        setCards(prev => prev.map(c => (c.id === editingCard.id ? updated : c)))
      } else {
        const saved = await saveAlterEgo(draft)
        setCards(prev => [saved, ...prev])
      }
    } catch {
      // приватный режим / ошибка — тихо
    }
    setEditingCard(null)
    setMode('list')
  }

  function handleRewrite(card) {
    setEditingCard(card)
    setWearCard(null)
    setMode('journal')
  }

  function handleCreate() {
    setEditingCard(null)
    setMode('journal')
  }

  async function handleDelete(card) {
    if (demoMode) {
      setCards(prev => prev.filter(c => c.id !== card.id))
      return
    }
    try {
      const next = await deleteAlterEgo(card.id)
      setCards(next)
    } catch {
      // тихо
    }
  }

  function handleWear(card) {
    setWearCard(card)
    setMode('wear')
  }

  function handleWearDone() {
    setWearCard(null)
    setMode('list')
  }

  function handleJournalCancel() {
    setEditingCard(null)
    setMode('list')
  }

  // ── Wear mask fullscreen ──
  if (mode === 'wear' && wearCard) {
    return <WearMask card={wearCard} onDone={handleWearDone} onRewrite={handleRewrite} />
  }

  // ── Creation/edit journal ──
  if (mode === 'journal') {
    const initialDraft = editingCard
      ? {
          who: editingCard.who || '',
          name: editingCard.name || '',
          mindset: editingCard.mindset || '',
          never: editingCard.never || '',
          when: editingCard.when || '',
          phrase: editingCard.phrase || '',
        }
      : emptyDraft()
    return (
      <AlterEgoJournal
        initialDraft={initialDraft}
        editingId={editingCard?.id}
        onSave={handleSave}
        onCancel={handleJournalCancel}
      />
    )
  }

  // ── List view ──
  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={listSurfaceStyle} data-testid="alter-ego-screen">
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <BackButton onClick={onBack} />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div
          className="w-full max-w-md mx-auto flex flex-1 flex-col"
          style={{ paddingInline: '21px' }}
        >
          <h1 className="font-display mx-type-page text-cream lowercase text-center mt-4 mb-2">
            альтер-эго.
          </h1>

          {loading ? (
            <p className="text-muted text-[14px] text-center mt-8">Загружаю…</p>
          ) : (
            <>
              {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <img
                    src={alterEgoMask}
                    alt=""
                    className="mx-alter-ego__character mx-alter-ego__character--lg"
                    aria-hidden="true"
                  />
                  <p className="mt-6 text-[15px] text-cream leading-relaxed px-6">
                    У каждого есть маска, в которой он сильнее. Собери свою.
                  </p>
                  <button
                    type="button"
                    className="mx-alter-ego__create mx-tap-target"
                    data-testid="alter-ego-create"
                    onClick={handleCreate}
                    style={{ marginTop: 24, maxWidth: 280 }}
                  >
                    <Plus size={20} aria-hidden="true" /> Создать новое
                  </button>
                </div>
              ) : (
                <>
                  <div className="mx-alter-ego__list">
                    {cards.map(card => (
                      <AlterEgoCard
                        key={card.id}
                        card={card}
                        onWear={handleWear}
                        onRewrite={handleRewrite}
                        onDelete={demoMode ? handleDelete : undefined}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mx-alter-ego__create mx-tap-target"
                    data-testid="alter-ego-create"
                    onClick={handleCreate}
                  >
                    <Plus size={20} aria-hidden="true" /> Создать новое
                  </button>
                </>
              )}
            </>
          )}

          <p className="mx-alter-ego__disclaimer" style={{ marginTop: 'auto', paddingTop: 16 }}>
            {DISCLAIMER}
          </p>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
