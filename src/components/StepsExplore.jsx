import { useMemo, useRef, useState, useEffect } from 'react'
import { ArrowRight, ChevronRight, Ellipsis, Search, Shuffle } from 'lucide-react'

import JournalArt from './practice-art/JournalArt'
import SemanticGlyph from './SemanticGlyph'
import { getPracticeByKey, PRACTICE_COLLECTIONS } from '../lib/practiceCatalogRegistry'
import { isPreviewDemoMode } from '../lib/demoMode'
import { api } from '../lib/api'

import './StepsExplore.css'

/* ============================================================
   STEPS EXPLORE — Stoic Explore-редизайн вкладки «Шаги»
   Решение владельца от 27.09.2026. Референс:
   docs/references/stoic-explore-2026-09-26.md
   ============================================================ */

const HIDDEN_PRACTICES_KEY = 'mx-steps-hidden-practices'

function readHiddenPractices() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_PRACTICES_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function writeHiddenPractices(set) {
  localStorage.setItem(HIDDEN_PRACTICES_KEY, JSON.stringify([...set]))
}

/* --- Силуэт головы для блока чек-ина эмоций --- */
function HeadSilhouette() {
  return (
    <svg
      className="mx-steps-head-silhouette"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 8c-14 0-24 10-24 24 0 8 4 14 8 18v8c0 4 3 6 6 6h20c3 0 6-2 6-6v-8c4-4 8-10 8-18 0-14-10-24-24-24z"
        fill="rgb(var(--c-card3))"
        stroke="rgb(var(--c-border))"
        strokeWidth="1"
      />
      <circle cx="30" cy="30" r="3" fill="rgb(var(--c-muted))" />
      <circle cx="50" cy="30" r="3" fill="rgb(var(--c-muted))" />
      <path
        d="M32 42c2 3 5 5 8 5s6-2 8-5"
        stroke="rgb(var(--c-muted))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* --- 1. Шапка: «шаги.» + кнопка поиска --- */
function StepsHeader({ searchOpen, onToggleSearch }) {
  return (
    <header className="mx-steps-header">
      <h1 className="font-display mx-type-page text-cream lowercase">шаги.</h1>
      <button
        type="button"
        className="mx-steps-search-btn"
        aria-label={searchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
        onClick={onToggleSearch}
      >
        <Search size={20} strokeWidth={1.5} />
      </button>
    </header>
  )
}

/* --- 2. Герой-карточка --- */
function HeroCard({ onOpen }) {
  return (
    <article className="mx-steps-hero">
      <div className="mx-steps-hero__art" aria-hidden="true">
        <JournalArt />
      </div>
      <div className="mx-steps-hero__body">
        <span className="mx-steps-hero__label font-label">ЖУРНАЛ · СЕГОДНЯ</span>
        <h2 className="mx-steps-hero__title">Разбери день на части</h2>
        <p className="mx-steps-hero__desc">
          Семь простых вопросов, чтобы увидеть главное — что важно, что мешает
          и какой шаг сделать прямо сейчас.
        </p>
        <button type="button" className="mx-steps-pill mx-steps-pill--light" onClick={onOpen}>
          Начать <ArrowRight size={15} />
        </button>
      </div>
    </article>
  )
}

/* --- 3. Карточка практики в сетке --- */
function PracticeCard({ practice, isGuest, onOpen, onPin }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isNew = practice.key === 'lila-discover' || practice.key === 'alter-ego'
  const badge = practice.soon ? null : isNew ? 'НОВОЕ' : 'РЕКОМЕНДУЕМ'

  function hide() {
    const hidden = readHiddenPractices()
    hidden.add(practice.key)
    writeHiddenPractices(hidden)
    setMenuOpen(false)
    // Перезагрузка не нужна — родитель перерисует через state
    window.dispatchEvent(new CustomEvent('mx-steps-hidden-changed'))
  }

  return (
    <article className="mx-steps-card" data-soon={practice.soon ? 'true' : undefined}>
      <button
        type="button"
        className="mx-steps-card__main"
        disabled={practice.soon}
        aria-label={practice.soon ? `${practice.title}, скоро` : `Открыть ${practice.title}`}
        onClick={() => !practice.soon && onOpen(practice)}
      >
        <span className="mx-steps-card__icon" aria-hidden="true">
          <SemanticGlyph kind={practice.kind || 'journal'} animated={false} />
        </span>
        {badge && (
          <span
            className={`mx-steps-card__badge ${isNew ? 'mx-steps-card__badge--new' : ''}`}
          >
            {badge}
          </span>
        )}
        <span className="mx-steps-card__category font-label">
          {practice.section || 'Практика'}
        </span>
        <strong className="mx-steps-card__title">{practice.title}</strong>
        <small className="mx-steps-card__desc">
          {practice.soon ? 'Скоро' : practice.subtitle}
        </small>
      </button>
      {!practice.soon && (
        <div className="mx-steps-card__menu">
          <button
            type="button"
            className="mx-steps-card__menu-btn"
            aria-label="Меню практики"
            aria-expanded={menuOpen}
            onClick={e => {
              e.stopPropagation()
              setMenuOpen(v => !v)
            }}
          >
            <Ellipsis size={18} />
          </button>
          {menuOpen && (
            <div className="mx-steps-card__menu-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onOpen(practice)
                }}
              >
                Открыть
              </button>
              {!isGuest && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onPin(practice)
                  }}
                >
                  В избранное
                </button>
              )}
              <button type="button" role="menuitem" onClick={hide}>
                Показывать реже
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function PracticeGrid({ practices, isGuest, onOpen, onPin }) {
  const [, force] = useState(0)
  useEffect(() => {
    const handler = () => force(v => v + 1)
    window.addEventListener('mx-steps-hidden-changed', handler)
    return () => window.removeEventListener('mx-steps-hidden-changed', handler)
  }, [])

  const hidden = readHiddenPractices()
  const visible = practices.filter(p => !hidden.has(p.key) && !p.soon)

  if (visible.length === 0) return null

  return (
    <section className="mx-steps-section" aria-label="Практики">
      <div className="mx-steps-grid">
        {visible.map(practice => (
          <PracticeCard
            key={practice.key}
            practice={practice}
            isGuest={isGuest}
            onOpen={onOpen}
            onPin={onPin}
          />
        ))}
      </div>
    </section>
  )
}

/* --- 4. Чек-ин эмоций --- */
function EmotionCheckIn({ onOpen }) {
  return (
    <section className="mx-steps-emotion" aria-label="Чек-ин эмоций">
      <div className="mx-steps-emotion__art" aria-hidden="true">
        <HeadSilhouette />
      </div>
      <div className="mx-steps-emotion__body">
        <span className="mx-steps-emotion__label font-label">ЧЕК-ИН ЭМОЦИЙ</span>
        <h2 className="mx-steps-emotion__title">Как бы ты описал свои чувства?</h2>
        <button type="button" className="mx-steps-pill" onClick={onOpen}>
          Начать <ArrowRight size={15} />
        </button>
      </div>
    </section>
  )
}

/* --- 5. Тема недели --- */
function ThemeOfWeek({ theme, themeLoading, themesError, onRetry, onOpen }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const trackRef = useRef(null)
  const questions = useMemo(
    () => (Array.isArray(theme?.days) ? theme.days.slice(0, 7) : []),
    [theme]
  )
  const safeIndex = Math.min(questionIndex, Math.max(0, questions.length - 1))

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const cards = [...track.querySelectorAll('.mx-steps-theme-q')]
    if (!cards.length) return
    const center = track.scrollLeft + track.clientWidth / 2
    const next = cards.reduce((closest, card, i) => {
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      const closestDist = Math.abs(
        cards[closest].offsetLeft + cards[closest].offsetWidth / 2 - center
      )
      return dist < closestDist ? i : closest
    }, 0)
    setQuestionIndex(next)
  }

  if (themeLoading || themesError || !theme || questions.length === 0) {
    return (
      <section className="mx-steps-section" aria-label="Тема недели" aria-live="polite">
        <h2 className="mx-steps-serif-title">
          {themeLoading ? 'Тема недели: загрузка…' : themesError ? 'Тема недели: ошибка' : 'Тема недели.'}
        </h2>
        {themeLoading ? (
          <div className="mx-steps-theme-skeleton" role="status">
            <span className="animate-pulse" />
          </div>
        ) : (
          <>
            <p className="mx-steps-empty-copy">
              {themesError
                ? 'Не удалось загрузить тему. Проверь соединение.'
                : 'Опубликованная тема появится здесь, когда будет доступна.'}
            </p>
            {themesError && (
              <button type="button" className="mx-steps-pill" onClick={onRetry}>
                Повторить
              </button>
            )}
          </>
        )}
      </section>
    )
  }

  return (
    <section className="mx-steps-section" aria-labelledby="steps-theme-week">
      <h2 className="mx-steps-serif-title" id="steps-theme-week">
        Тема недели: {theme.title}.
      </h2>
      <div className="mx-steps-theme-track" ref={trackRef} onScroll={handleScroll}>
        {questions.map((q, i) => (
          <article className="mx-steps-theme-q" key={q.day ?? i}>
            <span className="mx-steps-theme-q__num">{q.day ?? i + 1}</span>
            <strong className="mx-steps-theme-q__text">{q.text}</strong>
            {q.prompt && <span className="mx-steps-theme-q__prompt">{q.prompt}</span>}
          </article>
        ))}
      </div>
      <span
        className="mx-steps-dots"
        role="img"
        aria-label={`Вопрос ${safeIndex + 1} из ${questions.length}`}
      >
        {questions.map((q, i) => (
          <i key={q.day ?? i} data-active={i === safeIndex ? 'true' : undefined} aria-hidden="true" />
        ))}
      </span>
      <button type="button" className="mx-steps-pill" onClick={() => onOpen(theme)}>
        Начать запись <ArrowRight size={15} />
      </button>
    </section>
  )
}

/* --- 6. Другие темы --- */
function OtherThemes({ themes, onOpen }) {
  const otherThemes = themes.slice(1)
  if (otherThemes.length === 0) return null

  const unpassed = otherThemes.filter(
    t => (t.reflected_days || 0) < (t.total_days || 0)
  )

  function surprise() {
    if (unpassed.length === 0) return
    const random = unpassed[Math.floor(Math.random() * unpassed.length)]
    onOpen(random)
  }

  return (
    <section className="mx-steps-section" aria-labelledby="steps-other-themes">
      <h2 className="mx-steps-serif-title" id="steps-other-themes">Другие темы</h2>
      <div className="mx-steps-themes-list">
        {otherThemes.map(theme => {
          const total = theme.total_days || 0
          const done = theme.reflected_days || 0
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <button
              type="button"
              key={theme.id}
              className="mx-steps-theme-row"
              onClick={() => onOpen(theme)}
            >
              <div className="mx-steps-theme-row__body">
                <strong className="mx-steps-theme-row__title">{theme.title}.</strong>
                <span className="mx-steps-theme-row__desc">{theme.subtitle}</span>
                <span className="mx-steps-theme-row__progress">
                  <span className="mx-steps-theme-row__bar" style={{ width: `${pct}%` }} />
                </span>
              </div>
              <ChevronRight size={18} className="mx-steps-theme-row__chevron" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      {unpassed.length > 0 && (
        <button type="button" className="mx-steps-pill mx-steps-pill--surprise" onClick={surprise}>
          <Shuffle size={15} /> Удиви меня
        </button>
      )}
    </section>
  )
}

/* --- 7. Все темы --- */
const THEME_FILTERS = ['Все', 'Пройдены', 'В процессе', 'Не начаты']

function themeStatus(theme) {
  const total = theme.total_days || 0
  const done = theme.reflected_days || 0
  if (done >= total && total > 0) return 'Пройдены'
  if (done > 0) return 'В процессе'
  return 'Не начаты'
}

function AllThemes({ themes, onOpen, isEmpty }) {
  const [filter, setFilter] = useState('Все')

  const filtered = filter === 'Все' ? themes : themes.filter(t => themeStatus(t) === filter)

  return (
    <section className="mx-steps-section" aria-labelledby="steps-all-themes">
      <h2 className="mx-steps-serif-title" id="steps-all-themes">Все темы</h2>
      <div className="mx-steps-chips" role="tablist">
        {THEME_FILTERS.map(f => (
          <button
            type="button"
            key={f}
            role="tab"
            aria-selected={filter === f ? 'true' : undefined}
            className={`mx-steps-chip ${filter === f ? 'is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {isEmpty || filtered.length === 0 ? (
        <div className="mx-steps-empty">
          <div className="mx-steps-empty__art" aria-hidden="true">
            <SemanticGlyph kind="journal" animated={false} />
          </div>
          <strong className="mx-steps-empty__title">Здесь пока пусто</strong>
          <p className="mx-steps-empty__desc">
            Выбери тему и пройди её до конца — она появится здесь.
          </p>
        </div>
      ) : (
        <div className="mx-steps-themes-list">
          {filtered.map(theme => {
            const total = theme.total_days || 0
            const done = theme.reflected_days || 0
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <button
                type="button"
                key={theme.id}
                className="mx-steps-theme-row"
                onClick={() => onOpen(theme)}
              >
                <div className="mx-steps-theme-row__body">
                  <strong className="mx-steps-theme-row__title">{theme.title}.</strong>
                  <span className="mx-steps-theme-row__desc">{theme.subtitle}</span>
                  <span className="mx-steps-theme-row__progress">
                    <span className="mx-steps-theme-row__bar" style={{ width: `${pct}%` }} />
                  </span>
                </div>
                <ChevronRight size={18} className="mx-steps-theme-row__chevron" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* --- Коллекции (сохраняем для совместимости) --- */
function CollectionsSection({ onOpen }) {
  const visibleCollections = PRACTICE_COLLECTIONS.filter(c => c.key !== 'lila' && !c.soon)
  if (visibleCollections.length === 0) return null

  return (
    <section className="mx-steps-section" aria-label="Коллекции">
      <h2 className="mx-steps-section-title">Коллекции</h2>
      <div className="mx-steps-collections">
        {visibleCollections.map(collection => (
          <button
            type="button"
            key={collection.key}
            className="mx-steps-collection"
            onClick={() => onOpen(collection)}
          >
            <span className="mx-steps-collection__icon" aria-hidden="true">
              <SemanticGlyph kind={collection.kind} animated={false} />
            </span>
            <strong>{collection.title}</strong>
            <small>{collection.description}</small>
            <ChevronRight size={17} className="mx-steps-collection__chevron" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  )
}

/* --- Поиск --- */
function SearchOverlay({ practices, themes, onOpenPractice, onOpenTheme, onClose }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const matchedPractices = q
    ? practices.filter(p => !p.soon && (p.title?.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q)))
    : []
  const matchedThemes = q
    ? themes.filter(t => t.title?.toLowerCase().includes(q) || t.subtitle?.toLowerCase().includes(q))
    : []

  return (
    <div className="mx-steps-search">
      <div className="mx-steps-search__bar">
        <input
          type="search"
          placeholder="Поиск практик и тем"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          className="mx-steps-search__input"
        />
        <button type="button" className="mx-steps-search__close" aria-label="Закрыть поиск" onClick={onClose}>
          <ArrowRight size={18} />
        </button>
      </div>
      {q && (
        <div className="mx-steps-search__results">
          {matchedPractices.length === 0 && matchedThemes.length === 0 && (
            <p className="mx-steps-search__empty">Ничего не найдено.</p>
          )}
          {matchedPractices.map(p => (
            <button
              type="button"
              key={p.key}
              className="mx-steps-search__result"
              onClick={() => {
                onOpenPractice(p)
                onClose()
              }}
            >
              <SemanticGlyph kind={p.kind || 'journal'} animated={false} />
              <span>{p.title}</span>
            </button>
          ))}
          {matchedThemes.map(t => (
            <button
              type="button"
              key={t.id}
              className="mx-steps-search__result"
              onClick={() => {
                onOpenTheme(t)
                onClose()
              }}
            >
              <SemanticGlyph kind="journal" animated={false} />
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function StepsExplore({
  practices,
  rituals,
  ascezas,
  themes,
  themeLoading = false,
  themesError = false,
  onRetryThemes,
  onOpenPractice,
  onOpenJournal,
  onOpenTheme,
  onOpenMood,
  onOpenCollection,
  user,
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const isGuest = Boolean(user?.is_guest)
  const isDemo = isPreviewDemoMode()
  const isEmpty = isDemo && new URLSearchParams(window.location.search).get('empty') === '1'

  const visiblePractices = useMemo(() => practices || [], [practices])
  const visibleThemes = useMemo(() => themes || [], [themes])

  async function handlePin(practice) {
    if (!user) return
    try {
      await api.pinnedPractices.add(user.id, practice.key)
    } catch {
      // silent — demo handles it
    }
  }

  function handleOpenPractice(practice) {
    if (practice.key === 'mood' && onOpenMood) {
      onOpenMood()
      return
    }
    onOpenPractice(practice)
  }

  return (
    <div className="mx-steps-explore">
      <StepsHeader searchOpen={searchOpen} onToggleSearch={() => setSearchOpen(v => !v)} />

      {searchOpen ? (
        <SearchOverlay
          practices={visiblePractices}
          themes={visibleThemes}
          onOpenPractice={handleOpenPractice}
          onOpenTheme={onOpenTheme}
          onClose={() => setSearchOpen(false)}
        />
      ) : (
        <>
          <HeroCard onOpen={onOpenJournal} />

          <PracticeGrid
            practices={visiblePractices}
            isGuest={isGuest}
            onOpen={handleOpenPractice}
            onPin={handlePin}
          />

          <EmotionCheckIn onOpen={onOpenMood} />

          <ThemeOfWeek
            theme={visibleThemes[0] || null}
            themeLoading={themeLoading}
            themesError={themesError}
            onRetry={onRetryThemes}
            onOpen={onOpenTheme}
          />

          {!isEmpty && (
            <OtherThemes themes={visibleThemes} onOpen={onOpenTheme} />
          )}

          <AllThemes
            themes={isEmpty ? [] : visibleThemes}
            onOpen={onOpenTheme}
            isEmpty={isEmpty}
          />

          <CollectionsSection onOpen={onOpenCollection} />
        </>
      )}
    </div>
  )
}
