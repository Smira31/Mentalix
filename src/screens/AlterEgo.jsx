import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, ArrowLeft, Plus, Pencil, Sparkles } from 'lucide-react'

import { platform } from '../platform'
import BackButton from '../components/BackButton'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  getFullscreenPortalTarget,
} from '../lib/fullscreenSurface'
import { isPreviewDemoMode } from '../lib/demoMode'
import {
  loadAlterEgos,
  saveAlterEgo,
  updateAlterEgo,
  deleteAlterEgo,
} from '../lib/alterEgoStorage'
import alterEgoMask from '../assets/alter-ego/alter-ego-mask.webp'

import './AlterEgo.css'

const DISCLAIMER = 'Это упражнение для уверенности, не терапия'

const SITUATION_OPTIONS = [
  { label: 'Выступление', value: 'Выступление' },
  { label: 'Трудный разговор', value: 'Трудный разговор' },
  { label: 'Тренировка', value: 'Тренировка' },
  { label: 'Свидание', value: 'Свидание' },
]

const QUALITY_CHIPS = [
  'уверенный',
  'спокойный',
  'дерзкий',
  'собранный',
  'тёплый',
  'бесстрашный',
  'точный',
  'щедрый',
]

const TOTAL_STEPS = 7

const DEMO_CARDS = [
  {
    id: 'demo-1',
    name: 'Командир',
    situation: 'Выступление',
    qualities: ['уверенный', 'собранный', 'точный'],
    posture: 'Прямая спина, спокойный взгляд, низкий голос',
    anchor: 'Я здесь главный',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'demo-2',
    name: 'Огонёк',
    situation: 'Свидание',
    qualities: ['тёплый', 'спокойный', 'щедрый'],
    posture: 'Расслабленные плечи, мягкий взгляд, тёплый голос',
    anchor: 'Мне с собой хорошо',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
]

function emptyDraft() {
  return {
    name: '',
    situation: '',
    situationCustom: '',
    qualities: [],
    posture: '',
    anchor: '',
  }
}

function resolveSituation(draft) {
  if (draft.situation === 'Своя') return draft.situationCustom.trim() || 'Своя ситуация'
  return draft.situation
}

function AlterEgoProgress({ step }) {
  return (
    <div className="mx-alter-ego__dots" aria-label={`Шаг ${step + 1} из ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className={i === step ? 'is-active' : i < step ? 'is-done' : ''}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function AlterEgoControls({ onBack, onNext, backLabel = 'Назад', nextLabel = 'Далее', nextDisabled = false }) {
  return (
    <div className="mx-alter-ego__controls">
      <button
        type="button"
        className="mx-alter-ego__back mx-tap-target"
        onClick={onBack}
        aria-label={backLabel}
      >
        <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
        <span>{backLabel}</span>
      </button>
      <button
        type="button"
        className="mx-alter-ego__next mx-tap-target"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={nextLabel}
      >
        <span>{nextLabel}</span>
        <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

/* ── Карточка альтер-эго ── */

function AlterEgoCard({ card, onWear, onEdit, onDelete }) {
  return (
    <article className="mx-alter-ego__card" data-testid="alter-ego-card">
      <img
        src={alterEgoMask}
        alt=""
        className="mx-alter-ego__character"
        aria-hidden="true"
      />
      <h3 className="mx-alter-ego__card-name">{card.name}</h3>
      <p className="mx-alter-ego__card-field">
        <strong>Ситуация:</strong> {card.situation}
      </p>
      <div className="mx-alter-ego__card-qualities">
        {card.qualities.map(q => (
          <span key={q} className="mx-alter-ego__card-quality">
            {q}
          </span>
        ))}
      </div>
      <p className="mx-alter-ego__card-field">
        <strong>Как держится:</strong> {card.posture}
      </p>
      <p className="mx-alter-ego__card-field">
        <strong>Фраза-якорь:</strong> «{card.anchor}»
      </p>
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
          data-testid="alter-ego-edit"
          onClick={() => onEdit(card)}
        >
          <Pencil size={16} aria-hidden="true" /> Изменить
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

function WearMask({ card, onDone }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [qualityIndex, setQualityIndex] = useState(-1)

  useEffect(() => {
    platform.haptic('light')
    // Показываем качества по очереди: 0 → 1 → 2, каждое 1.5 c
    const timers = []
    card.qualities.forEach((_, i) => {
      timers.push(setTimeout(() => setQualityIndex(i), (i + 1) * 1500))
    })
    return () => timers.forEach(clearTimeout)
  }, [card.qualities])

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle} data-testid="alter-ego-wear-screen">
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
      >
        <BackButton onClick={onDone} label="Готов" />
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
          <p className="mx-alter-ego__wear-anchor">«{card.anchor}»</p>
          {card.qualities.map((q, i) => (
            <p
              key={q}
              className={`mx-alter-ego__wear-quality${i === qualityIndex ? ' is-visible' : ''}`}
            >
              {q}
            </p>
          ))}
          <button
            type="button"
            className="mx-alter-ego__wear-done mx-tap-target"
            data-testid="alter-ego-wear-done"
            onClick={onDone}
          >
            Готов
          </button>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}

/* ── Поток создания/редактирования (7 шагов) ── */

function AlterEgoFlow({ initialDraft, editingId, onSave, onCancel }) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(initialDraft || emptyDraft())
  const { style: surfaceStyle } = useFullscreenSurface()

  const update = useCallback((patch) => {
    setDraft(prev => ({ ...prev, ...patch }))
  }, [])

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
    if (step === TOTAL_STEPS - 1) {
      const card = {
        ...draft,
        situation: resolveSituation(draft),
      }
      delete card.situationCustom
      onSave(card)
      return
    }
    setStep(s => s + 1)
  }

  const canProceed =
    step === 0 ||
    (step === 1 && Boolean(draft.situation)) ||
    (step === 2 && draft.name.trim().length > 0) ||
    (step === 3 && draft.qualities.length === 3) ||
    (step === 4 && draft.posture.trim().length > 0) ||
    (step === 5 && draft.anchor.trim().length > 0) ||
    step === 6

  function toggleQuality(q) {
    platform.haptic('light')
    setDraft(prev => {
      if (prev.qualities.includes(q)) {
        return { ...prev, qualities: prev.qualities.filter(x => x !== q) }
      }
      if (prev.qualities.length >= 3) return prev
      return { ...prev, qualities: [...prev.qualities, q] }
    })
  }

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle} data-testid="alter-ego-flow">
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
      >
        <BackButton onClick={handleBack} />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-1 flex-col">
          <AlterEgoProgress step={step} />

          {/* Шаг 0 — Вступление */}
          {step === 0 && (
            <div className="mx-alter-ego__step mx-alter-ego__step--center flex-1">
              <img
                src={alterEgoMask}
                alt=""
                className="mx-alter-ego__character mx-alter-ego__character--lg"
                aria-hidden="true"
              />
              <div className="mx-alter-ego__intro-text">
                <p>У каждого есть маска, в которой он сильнее.</p>
                <p>Собери свою.</p>
              </div>
            </div>
          )}

          {/* Шаг 1 — Ситуация */}
          {step === 1 && (
            <div className="mx-alter-ego__step mx-alter-ego__step--center flex-1">
              <h2 className="mx-alter-ego__title">Для какой ситуации маска?</h2>
              <p className="mx-alter-ego__subtitle">Выбери или впиши свою</p>
              <div className="mx-alter-ego__options">
                {SITUATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`mx-alter-ego__option mx-tap-target${draft.situation === opt.value ? ' is-selected' : ''}`}
                    onClick={() => update({ situation: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  key="custom"
                  type="button"
                  className={`mx-alter-ego__option mx-tap-target${draft.situation === 'Своя' ? ' is-selected' : ''}`}
                  onClick={() => update({ situation: 'Своя' })}
                >
                  Своя
                </button>
              </div>
              {draft.situation === 'Своя' && (
                <input
                  type="text"
                  className="mx-alter-ego__input"
                  placeholder="Опиши ситуацию"
                  value={draft.situationCustom}
                  onChange={e => update({ situationCustom: e.target.value })}
                  data-testid="alter-ego-situation-custom"
                />
              )}
            </div>
          )}

          {/* Шаг 2 — Имя */}
          {step === 2 && (
            <div className="mx-alter-ego__step mx-alter-ego__step--center flex-1">
              <h2 className="mx-alter-ego__title">Имя альтер-эго</h2>
              <p className="mx-alter-ego__subtitle">Как зовут твою маску?</p>
              <input
                type="text"
                className="mx-alter-ego__input"
                placeholder="Например, Командир"
                value={draft.name}
                onChange={e => update({ name: e.target.value })}
                data-testid="alter-ego-name"
                autoFocus
              />
            </div>
          )}

          {/* Шаг 3 — Три качества */}
          {step === 3 && (
            <div className="mx-alter-ego__step mx-alter-ego__step--center flex-1">
              <h2 className="mx-alter-ego__title">Три качества</h2>
              <p className="mx-alter-ego__subtitle">Выбери ровно три</p>
              <div className="mx-alter-ego__chips">
                {QUALITY_CHIPS.map(q => (
                  <button
                    key={q}
                    type="button"
                    className={`mx-alter-ego__chip mx-tap-target${draft.qualities.includes(q) ? ' is-selected' : ''}`}
                    onClick={() => toggleQuality(q)}
                    disabled={!draft.qualities.includes(q) && draft.qualities.length >= 3}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="mx-alter-ego__chip-count">
                {draft.qualities.length} из 3
              </p>
            </div>
          )}

          {/* Шаг 4 — Как держится */}
          {step === 4 && (
            <div className="mx-alter-ego__step mx-alter-ego__step--center flex-1">
              <h2 className="mx-alter-ego__title">Как держится</h2>
              <p className="mx-alter-ego__subtitle">Поза, взгляд, голос — одной строкой</p>
              <input
                type="text"
                className="mx-alter-ego__input"
                placeholder="Прямая спина, спокойный взгляд, низкий голос"
                value={draft.posture}
                onChange={e => update({ posture: e.target.value })}
                data-testid="alter-ego-posture"
                autoFocus
              />
            </div>
          )}

          {/* Шаг 5 — Фраза-якорь */}
          {step === 5 && (
            <div className="mx-alter-ego__step mx-alter-ego__step--center flex-1">
              <h2 className="mx-alter-ego__title">Фраза-якорь</h2>
              <p className="mx-alter-ego__subtitle">Одна строка, например «Я здесь главный»</p>
              <input
                type="text"
                className="mx-alter-ego__input"
                placeholder="Я здесь главный"
                value={draft.anchor}
                onChange={e => update({ anchor: e.target.value })}
                data-testid="alter-ego-anchor"
                autoFocus
              />
            </div>
          )}

          {/* Шаг 6 — Готово (превью карточки) */}
          {step === 6 && (
            <div className="mx-alter-ego__step mx-alter-ego__step--center flex-1">
              <img
                src={alterEgoMask}
                alt=""
                className="mx-alter-ego__character"
                aria-hidden="true"
              />
              <h2 className="mx-alter-ego__card-name" style={{ marginTop: 12 }}>
                {draft.name || '—'}
              </h2>
              <p className="mx-alter-ego__card-field">
                <strong>Ситуация:</strong> {resolveSituation(draft)}
              </p>
              <div className="mx-alter-ego__card-qualities">
                {draft.qualities.map(q => (
                  <span key={q} className="mx-alter-ego__card-quality">
                    {q}
                  </span>
                ))}
              </div>
              <p className="mx-alter-ego__card-field">
                <strong>Как держится:</strong> {draft.posture || '—'}
              </p>
              <p className="mx-alter-ego__card-field">
                <strong>Фраза-якорь:</strong> «{draft.anchor || '—'}»
              </p>
            </div>
          )}

          <p className="mx-alter-ego__disclaimer">{DISCLAIMER}</p>
        </div>
      </div>

      <AlterEgoControls
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={step === TOTAL_STEPS - 1 ? 'Сохранить' : 'Далее'}
        nextDisabled={!canProceed}
      />
    </div>,
    getFullscreenPortalTarget()
  )
}

/* ── Главный экран практики ── */

export default function AlterEgo({ user, onBack }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list') // 'list' | 'flow' | 'wear'
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

  async function handleSave(cardData) {
    if (demoMode) {
      const saved = {
        ...cardData,
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
        const updated = await updateAlterEgo(editingCard.id, cardData)
        setCards(prev => prev.map(c => (c.id === editingCard.id ? updated : c)))
      } else {
        const saved = await saveAlterEgo(cardData)
        setCards(prev => [saved, ...prev])
      }
    } catch {
      // приватный режим / ошибка — тихо
    }
    setEditingCard(null)
    setMode('list')
  }

  function handleEdit(card) {
    setEditingCard(card)
    setMode('flow')
  }

  function handleCreate() {
    setEditingCard(null)
    setMode('flow')
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

  function handleFlowCancel() {
    setEditingCard(null)
    setMode('list')
  }

  // ── Wear mask fullscreen ──
  if (mode === 'wear' && wearCard) {
    return <WearMask card={wearCard} onDone={handleWearDone} />
  }

  // ── Creation/edit flow ──
  if (mode === 'flow') {
    const initialDraft = editingCard
      ? {
          name: editingCard.name,
          situation: SITUATION_OPTIONS.some(o => o.value === editingCard.situation)
            ? editingCard.situation
            : 'Своя',
          situationCustom: SITUATION_OPTIONS.some(o => o.value === editingCard.situation)
            ? ''
            : editingCard.situation,
          qualities: editingCard.qualities,
          posture: editingCard.posture,
          anchor: editingCard.anchor,
        }
      : emptyDraft()
    return (
      <AlterEgoFlow
        initialDraft={initialDraft}
        editingId={editingCard?.id}
        onSave={handleSave}
        onCancel={handleFlowCancel}
      />
    )
  }

  // ── List view ──
  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={listSurfaceStyle} data-testid="alter-ego-screen">
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
      >
        <BackButton onClick={onBack} />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-1 flex-col">
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
                        onEdit={handleEdit}
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
