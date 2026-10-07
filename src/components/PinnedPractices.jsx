import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Brush,
  Check,
  LayoutGrid,
  Lightbulb,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  X,
} from 'lucide-react'

import './PinnedPractices.css'

import CardSystemGlyph, { practiceGlyphKind } from './CardSystemGlyph'
import { CatalogPuzzleArt } from './practice-art/CatalogPuzzleArt'
import { CatalogCandleArt } from './practice-art/CatalogCandleArt'
import { CatalogDieArt } from './practice-art/CatalogDieArt'

const TRACED_GLYPHS = {
  rituals: CatalogPuzzleArt,
  ascezas: CatalogCandleArt,
  daimon: CatalogDieArt,
}
import { api } from '../lib/api'
import { buildPracticeViewModels, PRACTICE_RAIL_KEYS } from '../lib/practiceCatalogRegistry'
import { getFullscreenPortalTarget, useFullscreenSurface } from '../lib/fullscreenSurface'
import { isTelegramRuntime } from '../lib/visualViewport'
import { useBackButton } from '../platform/telegram.hooks'
import {
  fetchPinnedPractices,
  invalidatePinnedPractices,
  peekPinnedPractices,
} from '../lib/pinnedPracticesDataCache'

function Sheet({
  title,
  subtitle = null,
  onClose,
  children,
  footer = null,
  overlay = null,
  undo = null,
  onUndo = null,
  variant = 'default',
}) {
  const { style: viewportStyle } = useFullscreenSurface()
  const telegram = isTelegramRuntime()

  useBackButton(onClose)

  const isLibrary = variant === 'library'
  const CloseIcon = isLibrary ? Check : X
  const closeLabel = isLibrary ? 'Сохранить и закрыть' : 'Закрыть'

  const content = (
    <div
      className={`mx-pinned-sheet-backdrop${isLibrary ? ' mx-pinned-sheet-backdrop--library' : ''}`}
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`mx-pinned-sheet${isLibrary ? ' mx-pinned-sheet--library' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ paddingTop: viewportStyle.paddingTop }}
      >
        <div className="mx-pinned-sheet__header">
          <div className="mx-pinned-sheet__header-top">
            {!telegram && (
              <button
                type="button"
                className="mx-pinned-sheet__circle"
                aria-label={closeLabel}
                onClick={onClose}
              >
                <CloseIcon size={20} aria-hidden="true" />
              </button>
            )}
          </div>
          <h2
            className={`font-display mx-type-page text-cream lowercase${isLibrary ? ' mx-pinned-sheet__title--left' : ''}`}
          >
            {title}
          </h2>
          {subtitle && <p className="mx-pinned-sheet__subtitle text-muted">{subtitle}</p>}
        </div>
        <div className="mx-pinned-sheet__body">{children}</div>
        {footer && <div className="mx-pinned-sheet__footer">{footer}</div>}
        {overlay && <div className="mx-pinned-sheet__overlay">{overlay}</div>}
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
  const TracedIcon = practice?.key ? TRACED_GLYPHS[practice.key] : null
  if (TracedIcon) {
    return (
      <span className="mx-pinned-practice-glyph" aria-hidden="true">
        <TracedIcon className="mx-pinned-practice-glyph__traced" />
      </span>
    )
  }
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

export default function PinnedPractices({
  user,
  onOpenPractice,
  rituals = [],
  ascezas = [],
  initialSheet = null,
}) {
  const [pinned, setPinned] = useState(() => normalizePinnedPractices(peekPinnedPractices(user.id)))
  const [loading, setLoading] = useState(() => !peekPinnedPractices(user.id))
  const [error, setError] = useState(false)
  const [sheet, setSheet] = useState(initialSheet)
  const [busyKeys, setBusyKeys] = useState(() => new Set())
  const [undo, setUndo] = useState(null)
  const [menuKey, setMenuKey] = useState(null)
  const [soonToast, setSoonToast] = useState(false)
  const [libraryFilter, setLibraryFilter] = useState('recommended')
  const [librarySearch, setLibrarySearch] = useState('')
  const todayDone = useMemo(
    () => ({
      rituals: rituals.some(ritual => ritual.today_level),
      ascezas: ascezas.some(asceza => asceza.today_status === 'held'),
    }),
    [rituals, ascezas]
  )
  const undoTimerRef = useRef(null)
  const soonTimerRef = useRef(null)
  const railRef = useRef(null)

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      if (soonTimerRef.current) clearTimeout(soonTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchPinnedPractices(user.id, { force: true })
      .then(items => {
        if (!active) return
        setPinned(normalizePinnedPractices(items))
        setError(false)
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

  async function togglePinned(practice, { undoable = true } = {}) {
    const key = practice.key

    // Per-practice guard: ignore taps while this practice's request is in flight
    if (busyKeys.has(key)) return

    if (pinnedIds.has(key)) {
      // ── REMOVE ──
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
        undoTimerRef.current = null
      }
      const item = pinned.find(i => i.practice_id === key)
      const index = pinned.findIndex(i => i.practice_id === key)

      // Optimistic removal
      setPinned(items => items.filter(i => i.practice_id !== key))
      setBusyKeys(prev => new Set(prev).add(key))

      try {
        await api.pinnedPractices.remove(user.id, key)
        invalidatePinnedPractices(user.id)
        // Тост «Удалено · Вернуть» показываем только там, где он нужен:
        // в библиотеке галочка снимается сразу, вернуть практику можно
        // повторным тапом по строке.
        if (undoable) {
          setUndo({ item, index })
          undoTimerRef.current = setTimeout(() => {
            setUndo(null)
            undoTimerRef.current = null
          }, 4000)
        }
      } catch {
        // Rollback: re-add the item at its original position
        setPinned(items => {
          const next = [...items]
          next.splice(index, 0, item)
          return next
        })
        setError(true)
      } finally {
        setBusyKeys(prev => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
      return
    }

    // ── ADD ──
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
      setUndo(null)
    }

    // Optimistic add with temp marker
    const tempItem = { practice_id: key, _pending: true }
    setPinned(items => [...items, tempItem])
    setBusyKeys(prev => new Set(prev).add(key))
    setError(false)

    try {
      const added = await api.pinnedPractices.add(user.id, key)
      setPinned(items => items.map(i => (i._pending && i.practice_id === key ? added : i)))
      invalidatePinnedPractices(user.id)
    } catch {
      // Rollback: remove the temp item
      setPinned(items => items.filter(i => !(i._pending && i.practice_id === key)))
      setError(true)
    } finally {
      setBusyKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  async function undoRemove() {
    if (!undo) return
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    const { item, index } = undo
    setUndo(null)

    // Optimistic re-add
    setPinned(items => {
      const next = [...items]
      next.splice(index, 0, item)
      return next
    })

    try {
      await api.pinnedPractices.add(user.id, item.practice_id)
      invalidatePinnedPractices(user.id)
    } catch {
      // Rollback the undo — remove again
      setPinned(items => items.filter(i => i.practice_id !== item.practice_id))
      setError(true)
    }
  }

  function openPractice(practice) {
    // Закрываем шторку до навигации, иначе портал persists поверх нового экрана.
    setSheet(null)
    // `sub` is the navigation contract. Keep `key` as a fallback so an old
    // persisted pin cannot navigate to an empty screen after a catalog update.
    onOpenPractice?.(practice.sub || practice.key)
  }

  // «Создать свою практику» — функция ещё не готова, показываем короткий тост.
  function showSoonToast() {
    setSoonToast(true)
    if (soonTimerRef.current) clearTimeout(soonTimerRef.current)
    soonTimerRef.current = setTimeout(() => {
      setSoonToast(false)
      soonTimerRef.current = null
    }, 2000)
  }

  function runMenuAction(action, practice) {
    setMenuKey(null)
    if (action === 'open') openPractice(practice)
    else togglePinned(practice)
  }

  return (
    <section className="mx-pinned-practices" aria-labelledby="pinned-practices-title">
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
          subtitle="Твой дневной набор — собери свою идеальную рутину."
          onClose={() => setSheet(null)}
          undo={undo}
          onUndo={undoRemove}
          footer={
            <div className="mx-pinned-sheet__footer-actions">
              <button
                type="button"
                className="cta-pill mx-pinned-sheet__pill"
                data-testid="practice-create-soon"
                onClick={showSoonToast}
              >
                <Brush size={18} aria-hidden="true" />
                <span>Создать свою практику</span>
              </button>
              <button
                type="button"
                className="cta-pill mx-pinned-sheet__pill"
                onClick={() => setSheet('library')}
              >
                <Plus size={18} aria-hidden="true" />
                <span>Добавить из библиотеки</span>
              </button>
            </div>
          }
        >
          {pinnedPractices.length === 0 ? (
            <div className="mx-pinned-manage-empty">
              <span className="mx-pinned-manage-empty__glyph" aria-hidden="true" />
              <p className="mx-pinned-manage-empty__text text-muted">
                Здесь будут твои практики. Добавь любимые из библиотеки.
              </p>
            </div>
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
                    data-testid="practice-manage-open"
                    aria-label={`Открыть практику: ${practice.title}`}
                    onClick={() => openPractice(practice)}
                  >
                    <PracticeGlyph practice={practice} />
                    <span className="mx-pinned-practice-card__title text-cream">
                      {practice.title}
                    </span>
                    {practice.description && (
                      <span className="mx-pinned-practice-card__desc text-muted">
                        {practice.description}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="mx-pinned-practice-card__more"
                    data-testid={`practice-card-more-${practice.key}`}
                    aria-label={`Действия: ${practice.title}`}
                    aria-expanded={menuKey === practice.key}
                    onClick={() => setMenuKey(key => (key === practice.key ? null : practice.key))}
                  >
                    <MoreHorizontal size={13} aria-hidden="true" />
                  </button>
                  {menuKey === practice.key && (
                    <>
                      <button
                        type="button"
                        className="mx-pinned-card-menu-backdrop"
                        aria-label="Закрыть меню"
                        onClick={() => setMenuKey(null)}
                      />
                      <div className="mx-pinned-card-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="mx-pinned-card-menu__item"
                          data-testid="practice-card-menu-open"
                          onClick={() => runMenuAction('open', practice)}
                        >
                          Открыть
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="mx-pinned-card-menu__item"
                          data-testid="practice-card-menu-remove"
                          onClick={() => runMenuAction('remove', practice)}
                        >
                          Убрать из набора
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {soonToast && (
            <div className="mx-pinned-soon-toast" role="status" data-testid="practices-soon-toast">
              Скоро: свои практики
            </div>
          )}
        </Sheet>
      )}

      {sheet === 'library' && (
        <Sheet
          title="библиотека практик."
          onClose={() => setSheet('manage')}
          variant="library"
          overlay={
            <div className="mx-library-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="text"
                className="mx-library-search__input"
                placeholder="Поиск"
                value={librarySearch}
                onChange={event => setLibrarySearch(event.target.value)}
                aria-label="Поиск практик"
              />
            </div>
          }
        >
          <div className="mx-library-filters" role="tablist" aria-label="Фильтр практик">
            <button
              type="button"
              className={`mx-library-chip${libraryFilter === 'recommended' ? ' is-active' : ''}`}
              role="tab"
              aria-selected={libraryFilter === 'recommended'}
              onClick={() => setLibraryFilter('recommended')}
            >
              <Lightbulb size={17} aria-hidden="true" />
              <span>Рекомендуем</span>
            </button>
            <button
              type="button"
              className={`mx-library-chip${libraryFilter === 'all' ? ' is-active' : ''}`}
              role="tab"
              aria-selected={libraryFilter === 'all'}
              onClick={() => setLibraryFilter('all')}
            >
              <LayoutGrid size={17} aria-hidden="true" />
              <span>Все</span>
            </button>
          </div>
          <div className="mx-library-list" role="list">
            {catalog
              .filter(practice =>
                libraryFilter === 'recommended'
                  ? PRACTICE_RAIL_KEYS.includes(practice.key)
                  : true
              )
              .filter(practice =>
                librarySearch
                  ? practice.title.toLowerCase().includes(librarySearch.toLowerCase())
                  : true
              )
              .map(practice => {
                const isPinned = pinnedIds.has(practice.key)
                return (
                  <button
                    type="button"
                    className="mx-library-row"
                    key={practice.key}
                    role="listitem"
                    aria-pressed={isPinned}
                    onClick={() => togglePinned(practice, { undoable: false })}
                  >
                    <span className="mx-library-row__icon" aria-hidden="true">
                      <PracticeGlyph practice={practice} />
                    </span>
                    <span className="mx-library-row__name">{practice.title}</span>
                    <span
                      className={`mx-library-row__toggle${isPinned ? ' is-pinned' : ''}`}
                      aria-hidden="true"
                    >
                      {isPinned ? <Check size={14} aria-hidden="true" /> : '+'}
                    </span>
                  </button>
                )
              })}
          </div>
          {error && (
            <p className="mx-type-meta text-muted mt-3 mx-library-error">
              Не получилось сохранить выбор. Попробуй ещё раз.
            </p>
          )}
        </Sheet>
      )}
    </section>
  )
}
