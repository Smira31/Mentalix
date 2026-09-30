import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight } from 'lucide-react'

import { peekThemeDetail, fetchThemeDetail, invalidateThemeDetail } from '../lib/themeDetailCache'
import { peekThemesData, fetchThemesData, invalidateThemesData } from '../lib/themesDataCache'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import { RoundBackButton } from '../components/NestedScreenHeader'
import {
  useFullscreenSurface,
  getFullscreenPortalTarget,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'

import ThemeScreen from './ThemeScreen'
import ThemeDirectory from './ThemeDirectory'
import './ThemeCarouselScreen.css'

/*
 * КАРУСЕЛЬ ТЕМЫ НЕДЕЛИ — Stoic-style экран-карусель карточек-вопросов.
 *
 * Открывается из карточки «Тема недели» на «Сегодня» (и из «Шагов»).
 * Показывает карусель карточек с крупной цифрой и текстом вопроса,
 * точки-пейджер и пилюлю «Начать запись» → поток записи (ThemeScreen).
 * Для пройденных вопросов — «Смотреть в пути».
 *
 * Экран живёт по общему fullscreen-контракту (см.
 * src/lib/fullscreenSurface.js): портал в body, высота из
 * visualViewport, отступ под контролы Telegram.
 */
export default function ThemeCarouselScreen({ user, themeId, onBack }) {
  const [data, setData] = useState(() => peekThemeDetail(user?.id, themeId))
  const [themes, setThemes] = useState(() => (user ? peekThemesData(user.id) || [] : []))
  const [activeId, setActiveId] = useState(themeId)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [writing, setWriting] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const { style } = useFullscreenSurface()
  const trackRef = useRef(null)
  const rafRef = useRef(null)
  const lastIndexRef = useRef(0)

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
    if (!user) return
    let alive = true
    fetchThemesData(user.id)
      .then(list => {
        if (alive) setThemes(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (alive) setThemes([])
      })
    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    if (!user || !activeId) return
    let alive = true
    fetchThemeDetail(user.id, activeId)
      .then(fresh => {
        if (alive && fresh) setData(fresh)
      })
      .catch(console.error)
    return () => {
      alive = false
    }
  }, [user, activeId])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function refreshData() {
    if (!user || !activeId) return
    invalidateThemeDetail(user.id, activeId)
    fetchThemeDetail(user.id, activeId, { force: true })
      .then(d => {
        if (d) setData(d)
      })
      .catch(console.error)
    invalidateThemesData(user.id)
    fetchThemesData(user.id, { force: true })
      .then(list => setThemes(Array.isArray(list) ? list : []))
      .catch(console.error)
  }

  function openTheme(id) {
    platform.haptic('light')
    setData(peekThemeDetail(user?.id, id))
    setQuestionIndex(0)
    setActiveId(id)
  }

  const questions = useMemo(() => (Array.isArray(data?.days) ? data.days.slice(0, 7) : []), [data])
  const safeIndex = Math.min(questionIndex, Math.max(0, questions.length - 1))
  const currentQuestion = questions[safeIndex]
  const isAnswered = !!currentQuestion?.reflection

  // При загрузке данных прокручиваем карусель к текущему дню —
  // чтобы человек продолжил с того места, где остановился, а не
  // с первого (возможно уже отвеченного) вопроса.
  useEffect(() => {
    if (!data || !trackRef.current) return
    const days = Array.isArray(data.days) ? data.days.slice(0, 7) : []
    if (!days.length) return
    const currentIdx = Math.max(
      0,
      days.findIndex(d => d.day === data.current_day)
    )
    const track = trackRef.current
    const cards = [...track.querySelectorAll('.mx-theme-carousel-q')]
    const card = cards[currentIdx]
    if (card) {
      track.scrollTo({
        left: card.offsetLeft - track.clientWidth / 2 + card.offsetWidth / 2,
      })
    }
    lastIndexRef.current = currentIdx
  }, [data])

  // Плавный скролл-обработчик: rAF-throttled, setState только
  // при смене активной карточки — без ре-рендера на каждый пиксель.
  function handleScroll() {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const track = trackRef.current
      if (!track || !track.clientWidth) return
      const cards = [...track.querySelectorAll('.mx-theme-carousel-q')]
      if (!cards.length) return
      const center = track.scrollLeft + track.clientWidth / 2
      let next = 0
      let minDist = Infinity
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
        if (dist < minDist) {
          minDist = dist
          next = i
        }
      })
      if (next !== lastIndexRef.current) {
        lastIndexRef.current = next
        setQuestionIndex(next)
      }
    })
  }

  function handleWrite() {
    if (!currentQuestion) return
    platform.haptic('light')
    setSelectedDay(currentQuestion.day)
    setWriting(true)
  }

  if (writing) {
    return (
      <ThemeScreen
        user={user}
        themeId={activeId}
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

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-theme-carousel-surface`} style={style}>
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="mx-theme-carousel-screen w-full max-w-md mx-auto px-[var(--mx-screen-x)] pt-2 pb-6 flex flex-col min-h-full">
          <RoundBackButton onClick={onBack} />

          <div className="mx-theme-carousel-header">
            <h1 className="mx-theme-carousel-heading">Тема недели:</h1>
            <h2 className="mx-theme-carousel-title">{data.title}.</h2>
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
                    data-active={i === safeIndex ? 'true' : 'false'}
                    data-answered={q.reflection ? 'true' : undefined}
                  >
                    <span className="mx-theme-carousel-q__num">{q.day ?? i + 1}</span>
                    <strong className="mx-theme-carousel-q__text">{q.text}</strong>
                    {q.prompt && <span className="mx-theme-carousel-q__prompt">{q.prompt}</span>}
                    {q.reflection && <span className="mx-theme-carousel-q__badge">✓ Записано</span>}
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

              <div className="mx-theme-carousel-sticky-pill mx-glass">
                <button
                  type="button"
                  className="mx-theme-carousel-cta"
                  data-testid="theme-carousel-cta"
                  onClick={handleWrite}
                >
                  {isAnswered ? 'Смотреть в пути' : 'Начать запись'} <ArrowRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-muted text-[13px] text-center mt-8">
              В этой теме пока нет вопросов.
            </p>
          )}
          <ThemeDirectory themes={themes} currentId={activeId} onOpen={openTheme} />
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
