import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import { isDemoEmulationActive } from '../lib/demoChrome'
import { Pencil, Trash2 } from 'lucide-react'
import { RoundBackButton } from '../components/NestedScreenHeader'
import {
  useFullscreenSurface,
  getFullscreenPortalTarget,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import {
  THOUGHT_KIND,
  loadDailyItems,
  readCachedDailyItems,
  removeDailyThought,
} from '../lib/dailyThoughtStorage'
import { getDailyThoughtForDate } from '../data/dailyThoughts'
import { ProgressGlassMenu, ProgressGlassMenuItem } from '../components/ProgressGlassMenu'

import './MyThoughtsScreen.css'

const MONTHS_FULL = [
  'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
  'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ',
]
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/*
 * ЭКРАН «МОИ МЫСЛИ» — список всех мыслей дня по месяцам.
 *
 * Своя мысль — карточка card2, радиус 16, текст 17/500,
 * под ним мелко дата и цитата дня, к которой она написана.
 * Тап по карточке — стеклянное меню «Изменить» / «Удалить».
 */
export default function MyThoughtsScreen({ user, onClose, onEditThought }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  // Кэш показываем сразу, следом обновляем список с сервера.
  const [items, setItems] = useState(() => readCachedDailyItems(user?.id))
  const [menuFor, setMenuFor] = useState(null)

  useEffect(() => {
    if (!user?.id) return

    let alive = true
    loadDailyItems(user.id)
      .then(next => {
        if (alive) setItems(next)
      })
      .catch(console.error)

    return () => {
      alive = false
    }
  }, [user?.id])

  const grouped = useMemo(() => {
    const map = {}
    for (const t of items) {
      const d = new Date(t.date + 'T00:00:00')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!map[key]) map[key] = { label: MONTHS_FULL[d.getMonth()], items: [] }
      map[key].items.push(t)
    }
    return Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1))
  }, [items])

  async function handleDelete(thought) {
    setMenuFor(null)
    platform.haptic('light')
    try {
      setItems(await removeDailyThought({ id: thought.id, userId: user?.id }))
    } catch (error) {
      console.error(error)
    }
  }

  function handleEdit(thought) {
    setMenuFor(null)
    onEditThought?.(thought)
  }

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      {/* В demo-режиме кнопку «назад» показывает пилюля Telegram, слот 52px
          пуст — убираем его, чтобы заголовок стоял так же близко к шапке,
          как «история.» на Прогрессе. Кнопка остаётся в DOM (невидимой):
          стек «назад» и testid сохраняются. */}
      <div
        className={
          isDemoEmulationActive()
            ? 'contents'
            : `${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`
        }
      >
        <RoundBackButton onClick={onClose} testId="my-thoughts-back" registerSystemBack />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] pt-2 pb-6">
          <h1 className="mx-my-thoughts__title font-display mx-type-page text-cream lowercase">мои мысли.</h1>

          {grouped.length === 0 && (
            <p className="mt-10 text-center text-[14px] text-muted">
              Здесь появятся твои мысли — записанные в «Мысли дня».
            </p>
          )}

          {grouped.map(([key, group]) => (
            <div key={key} className="mt-6 first:mt-2">
              <div className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-4">
                {group.label}
              </div>
              <div className="space-y-3">
                {group.items.map(thought => {
                  const quote = getDailyThoughtForDate(thought.date)
                  const isSaved = thought.kind !== THOUGHT_KIND
                  return (
                    <div key={thought.id} className="relative">
                      <button
                        type="button"
                        data-testid="my-thought-card"
                        className="mx-my-thoughts__card w-full rounded-2xl bg-[rgb(var(--c-card2))] p-4 text-left active:scale-[0.99] transition-transform"
                        onClick={() => {
                          platform.haptic('light')
                          setMenuFor(menuFor === thought.id ? null : thought.id)
                        }}
                      >
                        {isSaved && (
                          <span className="mb-1 inline-block rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
                            сохранено
                          </span>
                        )}
                        <p
                          className={`text-[17px] font-medium leading-relaxed text-cream ${
                            isSaved ? 'italic' : ''
                          }`}
                        >
                          {thought.text}
                        </p>
                        <p className="mt-2 text-[12px] text-muted">
                          {formatDateShort(thought.date)}
                          {!isSaved && quote?.text && (
                            <>
                              {' · '}
                              <span className="italic">{quote.text}</span>
                            </>
                          )}
                        </p>
                      </button>

                      {menuFor === thought.id && (
                        <div className="absolute right-2 top-full z-50 mt-1">
                          <ProgressGlassMenu>
                            <ProgressGlassMenuItem
                              icon={Pencil}
                              label="Изменить"
                              testId="my-thought-edit"
                              onClick={() => handleEdit(thought)}
                            />
                            <ProgressGlassMenuItem
                              icon={Trash2}
                              label="Удалить"
                              danger
                              testId="my-thought-delete"
                              onClick={() => handleDelete(thought)}
                            />
                          </ProgressGlassMenu>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
