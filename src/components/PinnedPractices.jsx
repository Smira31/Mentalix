import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Settings2, X } from 'lucide-react'

import BackButton from './BackButton'
import CardSystemGlyph, { practiceGlyphKind } from './CardSystemGlyph'
import { api } from '../lib/api'
import { buildPracticeViewModels } from '../lib/practiceCatalogRegistry'
import {
  getFullscreenPortalTarget,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import { isTelegramRuntime } from '../lib/visualViewport'
import {
  fetchPinnedPractices,
  invalidatePinnedPractices,
  peekPinnedPractices,
} from '../lib/pinnedPracticesDataCache'

function Sheet({ title, subtitle = null, onClose, children, footer = null, undo = null, onUndo = null }) {
  const { style: viewportStyle } = useFullscreenSurface()
  const telegram = isTelegramRuntime()

  const content = (
    <div
      className="mx-pinned-sheet-backdrop"
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section
        className="mx-pinned-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ paddingTop: viewportStyle.paddingTop }}
      >
        <div className="mx-pinned-sheet__header">
          <BackButton onClick={onClose} showInDemo />
          <h2 className="font-display mx-type-card text-cream lowercase">{title}</h2>
          {subtitle && <p className="mx-pinned-sheet__subtitle text-muted">{subtitle}</p>}
          {!telegram && (
            <button type="button" className="mx-icon-button" aria-label="Закрыть" onClick={onClose}>
              <X size={19} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="mx-pinned-sheet__body">{children}</div>
        {footer && <div className="mx-pinned-sheet__footer">{footer}</div>}
      </section>
      {undo && (
        <div className="mx-pinned-undo-toast" role="status">
          <span className="mx-pinned-undo-toast__text">Удалено</span>
          <button type="button" className="mx-pinned-undo-toast__action" onClick={onUndo}>
            Вернуть
          </button>
        </div>
      )}
    </div>
  )

  return typeof document === 'undefined' ? null : createPortal(content, getFullscreenPortalTarget())
}

function PracticeGlyph({ practice }) {
  return (
    <span className="mx-pinned-practice-glyph" aria-hidden="true">
      <CardSystemGlyph kind={practiceGlyphKind(practice)} />
    </span>
  )
}

// Скелетон ленты: те же классы плиток, что и у реальных карточек, —
// форма и размер совпадают, вёрстка не прыгает после загрузки.
function PinnedPracticesSkeleton() {
  return (
    <div
      className="mx-pinned-practices__rail"
      role="status"
      aria-label="Загрузка практик"
      data-testid="pinned-practices-skeleton"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div className="mx-pinned-practice-card" aria-hidden="true" key={index}>
          <span className="mx-pinned-practice-glyph animate-pulse" />
          <span className="mx-auto mb-1 block h-3 w-3/4 rounded-full bg-cream/10 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function normalizePinnedPractices(value) {
  return Array.isArray(value) ? value : []
}

export default function PinnedPractices({ user, onOpenPractice, rituals = [], ascezas = [] }) {
  const [pinned, setPinned] = useState(() => normalizePinnedPractices(peekPinnedPractices(user.id)))
  const [loading, setLoading] = useState(() => !peekPinnedPractices(user.id))
  const [error, setError] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [undo, setUndo] = useState(null)
  const todayDone = useMemo(
    () => ({
      rituals: rituals.some(ritual => ritual.today_level),
      ascezas: ascezas.some(asceza => asceza.today_status === 'held'),
    }),
    [rituals, ascezas]
  )
  const undoTimerRef = useRef(null)
  const railRef = useRef(null)

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchPinnedPractices(user.id)
      .then(items => {
        if (!active) return
        setPinned(normalizePinnedPractices(items))
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user.id])

  const catalog = useMemo(
    () => buildPracticeViewModels({}).filter(practice => practice.available),
    []
  )
  const pinnedIds = useMemo(() => new Set(pinned.map(item => item.practice_id)), [pinned])
  const pinnedPractices = pinned
    .map(item => catalog.find(practice => practice.key === item.practice_id))
    .filter(Boolean)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const stopEdgeSwipe = event => event.stopPropagation()
    rail.addEventListener('touchstart', stopEdgeSwipe, { passive: true })
    return () => rail.removeEventListener('touchstart', stopEdgeSwipe)
  }, [loading, pinnedPractices.length])

  async function togglePinned(practice) {
    if (busyId) return

    if (pinnedIds.has(practice.key)) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      const item = pinned.find(i => i.practice_id === practice.key)
      const index = pinned.findIndex(i => i.practice_id === practice.key)
      setPinned(items => items.filter(i => i.practice_id !== practice.key))
      undoTimerRef.current = setTimeout(() => {
        api.pinnedPractices.remove(user.id, practice.key).catch(() => setError(true))
        invalidatePinnedPractices(user.id)
        setUndo(null)
        undoTimerRef.current = null
      }, 4000)
      setUndo({ item, index })
      return
    }

    setBusyId(practice.key)
    setError(false)
    try {
      const added = await api.pinnedPractices.add(user.id, practice.key)
      setPinned(items => [...items, added])
      invalidatePinnedPractices(user.id)
    } catch {
      setError(true)
    } finally {
      setBusyId(null)
    }
  }

  function undoRemove() {
    if (!undo) return
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    setPinned(items => {
      const next = [...items]
      next.splice(undo.index, 0, undo.item)
      return next
    })
    setUndo(null)
  }

  function openPractice(practice) {
    // `sub` is the navigation contract. Keep `key` as a fallback so an old
    // persisted pin cannot navigate to an empty screen after a catalog update.
    onOpenPractice?.(practice.sub || practice.key)
  }

  return (
    <section className="mx-pinned-practices mt-6" aria-labelledby="pinned-practices-title">
      <div className="mx-pinned-practices__heading">
        <h2 id="pinned-practices-title" className="mx-type-section text-cream">
          Твои практики
        </h2>
        <button
          type="button"
          className="mx-icon-button mx-pinned-practices__filter mx-tap-target"
          data-testid="pinned-practices-manage"
          aria-label="Настроить твои практики"
          onClick={() => setSheet('manage')}
        >
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <PinnedPracticesSkeleton />
      ) : error && pinnedPractices.length === 0 ? (
        <p className="mx-type-list-body text-muted mt-3">Не получилось загрузить практики.</p>
      ) : pinnedPractices.length === 0 ? (
        <p className="mx-type-list-body text-muted mt-3">
          Здесь пока пусто. Добавь любимые практики кнопкой настройки или скрой раздел.
        </p>
      ) : (
        <div ref={railRef} className="mx-pinned-practices__rail" role="list">
          {pinnedPractices.map(practice => (
            <button
              type="button"
              className={`mx-pinned-practice-card ${todayDone[practice.key] ? 'is-done' : ''}`}
              data-testid="practice-tile"
              data-done={Boolean(todayDone[practice.key])}
              role="listitem"
              key={practice.key}
              aria-label={`Открыть практику: ${practice.title}`}
              onClick={() => openPractice(practice)}
            >
              <PracticeGlyph practice={practice} />
              <span className="mx-pinned-practice-card__title text-cream">{practice.title}</span>
            </button>
          ))}
        </div>
      )}

      {sheet === 'manage' && (
        <Sheet
          title="твои практики."
          subtitle="Твой дневной набор — нажимай, чтобы начать."
          onClose={() => setSheet(null)}
          undo={undo}
          onUndo={undoRemove}
          footer={
            <div className="mx-pinned-sheet__footer-actions">
              <button
                type="button"
                className="cta-pill mx-type-flow-action w-full"
                onClick={() => setSheet('library')}
              >
                Добавить из библиотеки
              </button>
            </div>
          }
        >
          {pinnedPractices.length === 0 ? (
            <p className="mx-type-list-body text-muted">Пока ничего не закреплено.</p>
          ) : (
            <div className="mx-pinned-practices__grid">
              {pinnedPractices.map(practice => (
                <div
                  className="mx-pinned-practice-card mx-pinned-practice-card--managed"
                  key={practice.key}
                >
                  <button
                    type="button"
                    className="mx-pinned-practice-card__main"
                    aria-label={`Открыть практику: ${practice.title}`}
                    onClick={() => openPractice(practice)}
                  >
                    <PracticeGlyph practice={practice} />
                    <span className="mx-pinned-practice-card__title text-cream">
                      {practice.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mx-pinned-practice-card__remove"
                    aria-label={`Открепить: ${practice.title}`}
                    onClick={() => togglePinned(practice)}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Sheet>
      )}

      {sheet === 'library' && (
        <Sheet title="библиотека практик." onClose={() => setSheet('manage')} undo={undo} onUndo={undoRemove}>
          <div className="mx-pinned-library" role="list">
            {catalog.map(practice => {
              const isPinned = pinnedIds.has(practice.key)
              return (
                <button
                  type="button"
                  className="mx-pinned-library__row"
                  key={practice.key}
                  role="listitem"
                  aria-pressed={isPinned}
                  onClick={() => togglePinned(practice)}
                >
                  <PracticeGlyph practice={practice} />
                  <span className="mx-pinned-library__name mx-type-list-title text-cream">
                    {practice.title}
                  </span>
                  <span
                    className={`mx-pinned-library__toggle ${isPinned ? 'is-pinned' : ''}`}
                    aria-hidden="true"
                  >
                    {isPinned ? <Check size={16} /> : '+'}
                  </span>
                </button>
              )
            })}
          </div>
          {error && (
            <p className="mx-type-meta text-muted mt-3">
              Не получилось сохранить выбор. Попробуй ещё раз.
            </p>
          )}
        </Sheet>
      )}
    </section>
  )
}
