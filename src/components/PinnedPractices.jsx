import { useEffect, useMemo, useState } from 'react'
import { Check, Settings2, X } from 'lucide-react'

import SemanticGlyph from './SemanticGlyph'
import { api } from '../lib/api'
import { PRACTICE_CATALOG_REGISTRY } from '../lib/practiceCatalogRegistry'
import {
  fetchPinnedPractices,
  invalidatePinnedPractices,
  peekPinnedPractices,
} from '../lib/pinnedPracticesDataCache'

function Sheet({ title, onClose, children, footer = null }) {
  return (
    <div className="mx-pinned-sheet-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="mx-pinned-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mx-pinned-sheet__header">
          <h2 className="font-display mx-type-card text-cream lowercase">{title}</h2>
          <button type="button" className="mx-icon-button" aria-label="Закрыть" onClick={onClose}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <div className="mx-pinned-sheet__body">{children}</div>
        {footer && <div className="mx-pinned-sheet__footer">{footer}</div>}
      </section>
    </div>
  )
}

function PracticeGlyph({ practice }) {
  return (
    <span className="mx-pinned-practice-glyph" aria-hidden="true">
      <SemanticGlyph kind={practice.kind} debugSource="PinnedPractices.jsx" />
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
    () => PRACTICE_CATALOG_REGISTRY.filter(practice => practice.available !== false),
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
    onOpenPractice?.(practice.sub)
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
        <p className="mx-type-list-body text-muted mt-3">Выбери практики, которые хочешь видеть здесь.</p>
      ) : (
        <div className="mx-pinned-practices__rail" role="list">
          {pinnedPractices.map(practice => (
            <button
              type="button"
              className="mx-pinned-practice-card"
              role="listitem"
              key={practice.key}
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
          title="твои практики"
          onClose={() => setSheet(null)}
          footer={
            <button type="button" className="cta-pill mx-type-flow-action w-full" onClick={() => setSheet('library')}>
              Добавить из библиотеки
            </button>
          }
        >
          {pinnedPractices.length === 0 ? (
            <p className="mx-type-list-body text-muted">Пока ничего не закреплено.</p>
          ) : (
            <div className="mx-pinned-practices__grid">
              {pinnedPractices.map(practice => (
                <div className="mx-pinned-practice-card mx-pinned-practice-card--managed" key={practice.key}>
                  <button type="button" className="mx-pinned-practice-card__main" onClick={() => openPractice(practice)}>
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
                  <span className="mx-pinned-library__name mx-type-list-title text-cream">{practice.title}</span>
                  <span className={`mx-pinned-library__toggle ${isPinned ? 'is-pinned' : ''}`} aria-hidden="true">
                    {isPinned ? <Check size={16} /> : '+'}
                  </span>
                </button>
              )
            })}
          </div>
          {error && <p className="mx-type-meta text-muted mt-3">Не получилось сохранить выбор. Попробуй ещё раз.</p>}
        </Sheet>
      )}
    </section>
  )
}
