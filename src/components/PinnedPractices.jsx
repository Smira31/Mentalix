import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, PenLine, Settings2, X } from 'lucide-react'

import BackButton from './BackButton'
import { api } from '../lib/api'
import { buildPracticeViewModels } from '../lib/practiceCatalogRegistry'
import {
  fetchPinnedPractices,
  invalidatePinnedPractices,
  peekPinnedPractices,
} from '../lib/pinnedPracticesDataCache'

function Sheet({ title, subtitle = null, onClose, children, footer = null }) {
  const content = (
    <div
      className="mx-pinned-sheet-backdrop"
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section className="mx-pinned-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mx-pinned-sheet__header">
          <BackButton onClick={onClose} showInDemo />
          <h2 className="font-display mx-type-card text-cream lowercase">{title}</h2>
          {subtitle && <p className="mx-pinned-sheet__subtitle text-muted">{subtitle}</p>}
          <button type="button" className="mx-icon-button" aria-label="Закрыть" onClick={onClose}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <div className="mx-pinned-sheet__body">{children}</div>
        {footer && <div className="mx-pinned-sheet__footer">{footer}</div>}
      </section>
    </div>
  )

  return typeof document === 'undefined' ? null : createPortal(content, document.body)
}

function PracticeGlyph({ practice }) {
  const icon =
    practice.key === 'lila-discover'
      ? 'planet'
      : practice.key === 'ascezas'
        ? 'ring'
        : practice.key === 'breathing' || practice.key === 'meditation'
          ? 'moon'
          : 'bulb'

  return (
    <span className="mx-pinned-practice-glyph" aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        {icon === 'bulb' && (
          <>
            <path d="M32 9c-9.1 0-16.5 7.4-16.5 16.5 0 5.9 3 10 7.2 13.8 2.5 2.2 3.5 4.1 3.5 7.2h11.6c0-3.1 1-5 3.5-7.2 4.2-3.8 7.2-7.9 7.2-13.8C48.5 16.4 41.1 9 32 9Z" />
            <path d="M27 51h10M28.5 55h7" />
            <path d="M32 46.5V33M26.5 29.5l5.5 3.5 5.5-3.5" />
          </>
        )}
        {icon === 'ring' && (
          <>
            <circle cx="32" cy="32" r="18" />
            <circle cx="32" cy="32" r="12" />
            <path d="M32 32 43 21" />
          </>
        )}
        {icon === 'planet' && (
          <>
            <ellipse cx="32" cy="33" rx="23" ry="8" transform="rotate(-18 32 33)" />
            <circle cx="33" cy="29" r="11" />
            <path d="M13 40c7 3 22 4 38-2" />
          </>
        )}
        {icon === 'moon' && (
          <path d="M42 14c-8 2-14 9-14 18 0 10 8 18 18 18 2 0 4-.4 6-1.1A20 20 0 1 1 42 14Z" />
        )}
      </svg>
    </span>
  )
}

export default function PinnedPractices({ user, onOpenPractice }) {
  const [pinned, setPinned] = useState(() => peekPinnedPractices(user.id) || [])
  const [loading, setLoading] = useState(() => !peekPinnedPractices(user.id))
  const [error, setError] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let active = true
    fetchPinnedPractices(user.id)
      .then(items => {
        if (active) setPinned(items)
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

  async function togglePinned(practice) {
    if (busyId) return
    setBusyId(practice.key)
    setError(false)
    try {
      if (pinnedIds.has(practice.key)) {
        await api.pinnedPractices.remove(user.id, practice.key)
        setPinned(items => items.filter(item => item.practice_id !== practice.key))
      } else {
        const added = await api.pinnedPractices.add(user.id, practice.key)
        setPinned(items => [...items, added])
      }
      invalidatePinnedPractices(user.id)
    } catch {
      setError(true)
    } finally {
      setBusyId(null)
    }
  }

  function openPractice(practice) {
    // `sub` is the navigation contract. Keep `key` as a fallback so an old
    // persisted pin cannot navigate to an empty screen after a catalog update.
    onOpenPractice?.(practice.sub || practice.key)
  }

  return (
    <section className="mx-pinned-practices mt-6" aria-labelledby="pinned-practices-title">
      <div className="mx-pinned-practices__heading">
        <h2 id="pinned-practices-title" className="font-display mx-type-card text-cream lowercase">
          твои практики
        </h2>
        <button
          type="button"
          className="mx-icon-button"
          aria-label="Настроить твои практики"
          onClick={() => setSheet('manage')}
        >
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <p className="mx-type-meta text-muted mt-3">Загрузка…</p>
      ) : error && pinnedPractices.length === 0 ? (
        <p className="mx-type-list-body text-muted mt-3">Не получилось загрузить практики.</p>
      ) : pinnedPractices.length === 0 ? (
        <p className="mx-type-list-body text-muted mt-3">
          Выбери практики, которые хочешь видеть здесь.
        </p>
      ) : (
        <div className="mx-pinned-practices__rail" role="list">
          {pinnedPractices.map(practice => (
            <button
              type="button"
              className="mx-pinned-practice-card"
              role="listitem"
              key={practice.key}
              aria-label={`Открыть практику: ${practice.title}`}
              onClick={() => openPractice(practice)}
            >
              <PracticeGlyph practice={practice} />
              <span className="mx-type-meta text-cream">{practice.title}</span>
            </button>
          ))}
        </div>
      )}

      {sheet === 'manage' && (
        <Sheet
          title="твои практики."
          subtitle="Твой дневной набор — нажимай, чтобы начать."
          onClose={() => setSheet(null)}
          footer={
            <div className="mx-pinned-sheet__footer-actions">
              <button
                type="button"
                className="mx-pinned-practices__create-entry"
                onClick={() => setSheet('library')}
              >
                <PenLine size={15} aria-hidden="true" />
                <span>Создать свои практики</span>
              </button>
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
                    <span className="mx-type-meta text-cream">{practice.title}</span>
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
        <Sheet title="библиотека практик" onClose={() => setSheet('manage')}>
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
