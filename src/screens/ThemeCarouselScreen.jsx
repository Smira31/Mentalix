import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, ChevronRight, Shuffle } from 'lucide-react'

import { api } from '../lib/api'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import { RoundBackButton } from '../components/NestedScreenHeader'
import SemanticGlyph from '../components/SemanticGlyph'
import {
  useFullscreenSurface,
  getFullscreenPortalTarget,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'

import ThemeScreen from './ThemeScreen'
import './ThemeCarouselScreen.css'

/*
 * КАРУСЕЛЬ ТЕМЫ НЕДЕЛИ — Stoic-style экран-карусель карточек-вопросов.
 *
 * Открывается из карточки «Тема недели» на «Сегодня» (и из «Шагов»).
 * Показывает карусель карточек с крупной цифрой и текстом вопроса,
 * точки-пейджер и пилюлю «Начать запись» → поток записи (ThemeScreen).
 * Для пройденных вопросов — «Смотреть в пути».
 * Ниже карусели — «Другие темы» и «Все темы» с фильтрами.
 *
 * Экран живёт по общему fullscreen-контракту (см.
 * src/lib/fullscreenSurface.js): портал в body, высота из
 * visualViewport, отступ под контролы Telegram.
 */
const THEME_FILTERS = ['Все', 'Пройдены', 'В процессе', 'Не начаты']

function themeStatus(theme) {
  const total = theme.total_days || 0
  const done = theme.reflected_days || 0
  if (done >= total && total > 0) return 'Пройдены'
  if (done > 0) return 'В процессе'
  return 'Не начаты'
}

/* --- «Другие темы» --- */
function OtherThemes({ themes, currentId, onOpen }) {
  const otherThemes = themes.filter(t => t.id !== currentId)
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
    <section className="mx-theme-carousel-section" aria-labelledby="carousel-other-themes">
      <h2 className="mx-theme-carousel-serif-title" id="carousel-other-themes">Другие темы</h2>
      <div className="mx-theme-carousel-themes-list">
        {otherThemes.map(theme => {
          const total = theme.total_days || 0
          const done = theme.reflected_days || 0
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <button
              type="button"
              key={theme.id}
              className="mx-theme-carousel-theme-row"
              onClick={() => onOpen(theme)}
            >
              <div className="mx-theme-carousel-theme-row__body">
                <strong className="mx-theme-carousel-theme-row__title">{theme.title}.</strong>
                <span className="mx-theme-carousel-theme-row__desc">{theme.subtitle}</span>
                <span className="mx-theme-carousel-theme-row__progress">
                  <span className="mx-theme-carousel-theme-row__bar" style={{ width: `${pct}%` }} />
                </span>
              </div>
              <ChevronRight size={18} className="mx-theme-carousel-theme-row__chevron" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      {unpassed.length > 0 && (
        <button type="button" className="mx-theme-carousel-surprise" onClick={surprise}>
          <Shuffle size={15} /> Удиви меня
        </button>
      )}
    </section>
  )
}

/* --- «Все темы» с фильтрами --- */
function AllThemes({ themes, currentId, onOpen }) {
  const [filter, setFilter] = useState('Все')
  const allThemes = themes.filter(t => t.id !== currentId)

  const filtered = filter === 'Все' ? allThemes : allThemes.filter(t => themeStatus(t) === filter)

  return (
    <section className="mx-theme-carousel-section" aria-labelledby="carousel-all-themes">
      <h2 className="mx-theme-carousel-serif-title" id="carousel-all-themes">Все темы</h2>
      <div className="mx-theme-carousel-chips" role="tablist">
        {THEME_FILTERS.map(f => (
          <button
            type="button"
            key={f}
            role="tab"
            aria-selected={filter === f ? 'true' : undefined}
            className={`mx-theme-carousel-chip ${filter === f ? 'is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="mx-theme-carousel-empty">
          <div className="mx-theme-carousel-empty__art" aria-hidden="true">
            <SemanticGlyph kind="journal" animated={false} />
          </div>
          <strong className="mx-theme-carousel-empty__title">Здесь пока пусто</strong>
          <p className="mx-theme-carousel-empty__desc">
            Выбери тему и пройди её до конца — она появится здесь.
          </p>
        </div>
      ) : (
        <div className="mx-theme-carousel-themes-list">
          {filtered.map(theme => {
            const total = theme.total_days || 0
            const done = theme.reflected_days || 0
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <button
                type="button"
                key={theme.id}
                className="mx-theme-carousel-theme-row"
                onClick={() => onOpen(theme)}
              >
                <div className="mx-theme-carousel-theme-row__body">
                  <strong className="mx-theme-carousel-theme-row__title">{theme.title}.</strong>
                  <span className="mx-theme-carousel-theme-row__desc">{theme.subtitle}</span>
                  <span className="mx-theme-carousel-theme-row__progress">
                    <span className="mx-theme-carousel-theme-row__bar" style={{ width: `${pct}%` }} />
                  </span>
                </div>
                <ChevronRight size={18} className="mx-theme-carousel-theme-row__chevron" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function ThemeCarouselScreen({ user, themeId, themes = [], onBack }) {
  const [activeThemeId, setActiveThemeId] = useState(themeId)
  const [data, setData] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [writing, setWriting] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const { style } = useFullscreenSurface()
  const trackRef = useRef(null)

  useBackButton(() => {
    platform.haptic('light')
    if (writing) {
      setWriting(false)
      refreshData()
    } else {
      onBack()
    }
  })

  useEffect(() => {
    if (!user || !activeThemeId) return
    let alive = true
    setData(null)
    api.themes
      .get(activeThemeId, user.id)
      .then(fresh => {
        if (!alive) return
        setData(fresh)
      })
      .catch(console.error)
    return () => {
      alive = false
    }
  }, [user, activeThemeId])

  function refreshData() {
    if (!user || !activeThemeId) return
    api.themes
      .get(activeThemeId, user.id)
      .then(setData)
      .catch(console.error)
  }

  const questions = useMemo(
    () => (Array.isArray(data?.days) ? data.days.slice(0, 7) : []),
    [data]
  )
  const safeIndex = Math.min(questionIndex, Math.max(0, questions.length - 1))
  const currentQuestion = questions[safeIndex]

  // При загрузке данных прокручиваем карусель к текущему дню —
  // чтобы человек продолжил с того места, где остановился, а не
  // с первого (возможно уже отвеченного) вопроса.
  useEffect(() => {
    if (!data || !trackRef.current) return
    const days = Array.isArray(data.days) ? data.days.slice(0, 7) : []
    if (!days.length) return
    const currentIdx = days.findIndex(d => d.day === data.current_day)
    if (currentIdx <= 0) return
    const track = trackRef.current
    const cards = [...track.querySelectorAll('.mx-theme-carousel-q')]
    const card = cards[currentIdx]
    if (card) {
      track.scrollTo({
        left: card.offsetLeft - track.clientWidth / 2 + card.offsetWidth / 2,
      })
    }
  }, [data])

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const cards = [...track.querySelectorAll('.mx-theme-carousel-q')]
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

  function handleWrite() {
    if (!currentQuestion) return
    platform.haptic('light')
    setSelectedDay(currentQuestion.day)
    setWriting(true)
  }

  function handleOpenTheme(theme) {
    platform.haptic('light')
    setActiveThemeId(theme.id)
    setQuestionIndex(0)
  }

  if (writing) {
    return (
      <ThemeScreen
        user={user}
        themeId={activeThemeId}
        initialDay={selectedDay}
        onBack={() => {
          setWriting(false)
          refreshData()
        }}
      />
    )
  }

  if (!data) {
    return createPortal(
      <div className={FULLSCREEN_SHELL_CLASS} style={style}>
        <div className={FULLSCREEN_HEADER_SLOT_CLASS} aria-hidden="true" />
        <div className={FULLSCREEN_SCROLL_CLASS}>
          <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] pt-2 pb-6 flex flex-col min-h-full">
            <RoundBackButton onClick={onBack} />
            <p className="w-full m-auto px-6 text-center text-muted text-[13px]">Загрузка...</p>
          </div>
        </div>
      </div>,
      getFullscreenPortalTarget()
    )
  }

  const isAnswered = Boolean(currentQuestion?.reflection)

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={style}>
      <div className={FULLSCREEN_HEADER_SLOT_CLASS} aria-hidden="true" />
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] pt-2 pb-6 flex flex-col min-h-full">
          <RoundBackButton onClick={onBack} />

          <div className="mx-theme-carousel-header">
            <span className="mx-theme-carousel-label">Тема недели</span>
            <h2 className="mx-theme-carousel-title">{data.title}</h2>
            {data.subtitle && (
              <p className="mx-theme-carousel-subtitle">{data.subtitle}</p>
            )}
          </div>

          {questions.length > 0 ? (
            <>
              <div
                className="mx-theme-carousel-track"
                ref={trackRef}
                onScroll={handleScroll}
                role="region"
                aria-label="Вопросы темы"
              >
                {questions.map((q, i) => (
                  <article
                    className="mx-theme-carousel-q"
                    key={q.day ?? i}
                    data-answered={q.reflection ? 'true' : undefined}
                  >
                    <span className="mx-theme-carousel-q__num">{q.day ?? i + 1}</span>
                    <strong className="mx-theme-carousel-q__text">{q.text}</strong>
                    {q.prompt && (
                      <span className="mx-theme-carousel-q__prompt">{q.prompt}</span>
                    )}
                    {q.reflection && (
                      <span className="mx-theme-carousel-q__badge">✓ Записано</span>
                    )}
                  </article>
                ))}
              </div>

              <span
                className="mx-theme-carousel-dots"
                role="img"
                aria-label={`Вопрос ${safeIndex + 1} из ${questions.length}`}
              >
                {questions.map((q, i) => (
                  <i
                    key={q.day ?? i}
                    data-active={i === safeIndex ? 'true' : undefined}
                    aria-hidden="true"
                  />
                ))}
              </span>

              <button
                type="button"
                className="mx-theme-carousel-cta"
                data-testid="theme-carousel-cta"
                onClick={handleWrite}
              >
                {isAnswered ? 'Смотреть в пути' : 'Начать запись'} <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <p className="text-muted text-[13px] text-center mt-8">
              В этой теме пока нет вопросов.
            </p>
          )}

          <OtherThemes themes={themes} currentId={activeThemeId} onOpen={handleOpenTheme} />
          <AllThemes themes={themes} currentId={activeThemeId} onOpen={handleOpenTheme} />
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
