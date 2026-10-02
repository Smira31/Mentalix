import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

import { peekThemeDetail, fetchThemeDetail, invalidateThemeDetail } from '../lib/themeDetailCache'
import { peekThemesData, fetchThemesData, invalidateThemesData } from '../lib/themesDataCache'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import { RoundBackButton } from '../components/NestedScreenHeader'
import ThemeQuestionCarousel from '../components/ThemeQuestionCarousel'
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
 * Карусель карточек с крупной цифрой и текстом вопроса, точки-пейджер
 * и пилюля CTA → поток записи (ThemeScreen). Карусель рендерится через
 * общий компонент ThemeQuestionCarousel (тот же, что на экране «Шаги»).
 *
 * Экран живёт по общему fullscreen-контракту (см.
 * src/lib/fullscreenSurface.js): портал в body, высота из
 * visualViewport, отступ под контролы Telegram.
 */
export default function ThemeCarouselScreen({ user, themeId, onBack }) {
  const [data, setData] = useState(() => peekThemeDetail(user?.id, themeId))
  const [themes, setThemes] = useState(() => (user ? peekThemesData(user.id) || [] : []))
  const [activeId, setActiveId] = useState(themeId)
  const [writing, setWriting] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [loadError, setLoadError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const hasDataRef = useRef(Boolean(data))
  const { style } = useFullscreenSurface()

  // Пока открыт ThemeScreen (writing), «Назад» обрабатывает он сам — один обработчик на экран.
  useBackButton(() => {
    platform.haptic('light')
    onBack()
  }, !writing)

  useEffect(() => {
    hasDataRef.current = Boolean(data)
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
        if (alive && fresh) {
          setLoadError(false)
          setData(fresh)
        }
      })
      .catch(error => {
        console.error(error)
        if (alive && !hasDataRef.current) setLoadError(true)
      })
    return () => {
      alive = false
    }
  }, [user, activeId, retryToken])

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
    setActiveId(id)
  }

  const questions = useMemo(() => (Array.isArray(data?.days) ? data.days.slice(0, 7) : []), [data])

  // Индекс текущего дня для начальной прокрутки карусели.
  const initialScrollIndex = useMemo(() => {
    if (!data?.days) return 0
    const days = data.days.slice(0, 7)
    const idx = days.findIndex(d => d.day === data.current_day)
    return Math.max(0, idx)
  }, [data])

  function handleWrite(question) {
    platform.haptic('light')
    setSelectedDay(question.day)
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
            {loadError ? (
              <div className="w-full m-auto px-6 text-center" role="alert" data-testid="theme-load-error">
                <p className="text-muted text-[13px]">
                  Не удалось загрузить тему. Проверь соединение и попробуй ещё раз.
                </p>
                <button
                  type="button"
                  data-testid="theme-load-retry"
                  onClick={() => {
                    setLoadError(false)
                    setRetryToken(n => n + 1)
                  }}
                  className="mt-5 min-h-11 rounded-full bg-cream px-4 py-2 text-[13px] font-semibold text-emerald-deep"
                >
                  Повторить
                </button>
              </div>
            ) : (
              <p className="w-full m-auto px-6 text-center text-muted text-[13px]">Загрузка...</p>
            )}
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
            <ThemeQuestionCarousel
              key={activeId}
              questions={questions}
              initialIndex={initialScrollIndex}
              onWrite={handleWrite}
              onViewAnswer={handleWrite}
            />
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
