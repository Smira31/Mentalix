import { useCallback, useEffect, useRef, useState } from 'react'
import { platform, platformName } from '../platform'
import { useAutoDismissOnScroll } from '../lib/useAutoDismissOnScroll'
import { api } from '../lib/api'
import { fetchTodayDataWithRetry, invalidateTodayData, peekTodaySnapshot } from '../lib/todayDataCache'
import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { ChevronRight, ArrowUpRight, Lightbulb, X } from 'lucide-react'

import './Today.css'

import Path from './Path'
import YearPath from './YearPath'
import CheckIn from './CheckIn'
import ThemeScreen from './ThemeScreen'
import { DayArc } from '../components/Motif'
import BackButton from '../components/BackButton'
import cardMorningDone2x from '../assets/today/card-morning-done@2x.webp'
import cardMorningDone3x from '../assets/today/card-morning-done@3x.webp'
import cardEveningDone2x from '../assets/today/card-evening-done@2x.webp'
import cardEveningDone3x from '../assets/today/card-evening-done@3x.webp'

import History from './History'
import QuoteView from './QuoteView'
import SemanticGlyph from '../components/SemanticGlyph'
import EmptyState from '../components/EmptyState'
import StarterSetPicker from '../components/StarterSetPicker'
import PinnedPractices from '../components/PinnedPractices'
import SeriesBadges from './SeriesBadges'
import { useSynced } from '../lib/store'
import { getDailyThought } from '../data/dailyThoughts'
import { TODAY_CARDS_HIDDEN_KEY, parseHiddenCards } from '../lib/todayCardVisibility'
import { TodayCompareControl } from '../components/TodayMotionExperiment'
import { peekCachedStreak, rememberStreak, resolveDisplayedStreak } from '../lib/streakCache'
import { buildSeriesViewModel } from '../lib/series'
import { markSeriesTooltipSeen, shouldShowSeriesTooltip } from '../lib/seriesPreferences'
import { NewBadgeSheet } from './SeriesBadges'
import { resolveCheckInMode } from '../lib/todayCheckinMode'
import { formatReviewTime, resolveTodayCardStates, primaryCardKind } from '../lib/todayCardState'
import { collectActivityDays } from '../lib/series'
import { now as clockNow } from '../lib/clock'
import { demoScenario } from '../lib/demoMode'
import { pickVisibleTodayHint } from '../lib/todayHints'

const TODAY_COMPARE_REQUESTED =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('today_compare') === '1'

const INITIAL_TODAY_VARIANT =
  new URLSearchParams(window.location.search).get('today_variant') === 'before' ? 'before' : 'after'

// MXL-STARTER-SET-001 (issue #417): kill-switch для первого продакшен-раската.
// false полностью отключает picker и возвращает старый empty-state
// («Пока нет практик» + «Выбрать практику») без других изменений кода.
const STARTER_SET_ENABLED = import.meta.env.VITE_STARTER_SET_ENABLED === 'true'

// The redesigned workspace intentionally removes these two summary cards from
// the main flow; the underlying data and destination remain available in their
// dedicated screens.
const LEGACY_TODAY_SUMMARY_CARDS_ENABLED = false

// ── календарь недели + отдельные дневные streak strips ──

function todayGreeting() {
  const hour = clockNow().getHours()
  if (hour >= 5 && hour <= 11) return 'доброе утро.'
  if (hour >= 12 && hour <= 17) return 'добрый день.'
  if (hour >= 18 && hour <= 22) return 'добрый вечер.'
  return 'тихой ночи.'
}

function ReferenceFlame() {
  return (
    <svg className="mx-reference-flame" viewBox="0 0 24 28" aria-hidden="true">
      <path d="M13.8 1.8c.5 4.1-2.4 5.8-3.7 8.3C8.8 7.7 9.2 5.5 9.2 4 5.3 7.1 3.6 11 4.1 15.2c.6 5.5 4.3 9 8.3 9 4.7 0 8.1-3.5 8.1-8.2 0-4.7-3.1-8.7-6.7-14.2Z" />
      <path
        className="mx-reference-flame__inner"
        d="M13.1 13.2c1.9 2.3 2.7 3.5 2.7 5.2 0 1.9-1.2 3.4-3.1 3.4-1.7 0-2.9-1.3-2.9-3.2 0-1.6 1.1-3 3.3-5.4Z"
      />
    </svg>
  )
}

// DESIGN_SYSTEM.md §5.4: белый диск 28 px внутри тёмного кольца, чёрный силуэт
// (голова + плечи), плечи срезаны нижним краем диска. Своя иконка — фото из
// Telegram не используем.
function ReferenceProfileMark() {
  return (
    <svg className="mx-reference-profile-mark" viewBox="0 0 28 28" aria-hidden="true">
      <clipPath id="mx-profile-mark-disk">
        <circle cx="14" cy="14" r="14" />
      </clipPath>
      <circle cx="14" cy="14" r="14" fill="#fff" />
      <g clipPath="url(#mx-profile-mark-disk)" fill="#000">
        <circle cx="14" cy="11" r="5" />
        <path d="M3.5 29c0-6.3 4.7-10.6 10.5-10.6S24.5 22.7 24.5 29Z" />
      </g>
    </svg>
  )
}

function TodayWorkspaceHeader({ onOpenSettings, onOpenSeries, onOpenDemoPanel, streak = 0, onStreakClick }) {
  const pressTimer = useRef(null)
  useEffect(() => () => clearTimeout(pressTimer.current), [])
  const startPress = () => {
    if (!onOpenDemoPanel) return
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(onOpenDemoPanel, 1000)
  }
  const endPress = () => clearTimeout(pressTimer.current)
  // streak === null — история ещё грузится и кэша нет: огонь без числа.
  const streakLabel =
    streak == null
      ? 'Мой путь'
      : streak > 0
        ? `Мой путь. ${streak} ${streak === 1 ? 'день' : 'дней'}`
        : 'Мой путь. Серия ещё не началась'

  return (
    <header className="mx-demo-today-header">
      <button
        type="button"
        data-testid="today-streak-chip"
        className={`mx-demo-today-streak${streak === 0 ? ' mx-demo-today-streak--empty' : ''}`}
        aria-label={streakLabel}
        onClick={onStreakClick || onOpenSeries}
      >
        <ReferenceFlame />
        {streak > 0 && <strong>{streak}</strong>}
      </button>
      <strong className="mx-demo-today-greeting" onPointerDown={startPress} onPointerUp={endPress} onPointerCancel={endPress} onPointerLeave={endPress}>{todayGreeting()}</strong>
      <div className="mx-demo-today-header__tools">
        <button
          type="button"
          className="mx-demo-today-profile"
          data-testid="today-profile-button"
          aria-label="Открыть настройки"
          onClick={onOpenSettings}
        >
          <ReferenceProfileMark />
        </button>
      </div>
    </header>
  )
}

function WeekStrip({ checkin, history = [] }) {
  const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const now = clockNow()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return day
  })

  return (
    <div className="mx-today-week" role="group" aria-label="Календарь недели">
      <div className="mx-today-week__calendar">
        {days.map(day => {
          const isToday = day.toDateString() === now.toDateString()
          const dateKey = day.toISOString().slice(0, 10)
          const isCompleted = Boolean(
            (isToday && checkin) ||
            history.some(
              item =>
                item?.date &&
                String(item.date).slice(0, 10) === dateKey &&
                (item.review_completed_at || item.completed_at || item.status === 'completed')
            )
          )
          return (
            <div
              key={day.getTime()}
              className="mx-today-week-day"
              data-testid="today-week-day"
              data-today={isToday}
              data-completed={isCompleted}
            >
              <span className="mx-type-weekday">
                {names[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </span>
              <span className="mx-type-calendar-date">{day.getDate()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function pickCurrentTheme(themes) {
  if (!Array.isArray(themes) || themes.length === 0) return null

  return themes.find(t => t?.is_current) || themes[0] || null
}

// ============================================================
// TODAY
// ============================================================

export default function Today({
  user,
  onOpenPractice,
  initialSub = null,
  returnFlowActive = false,
  onReturnFlowEvent,
  onFlowChange,
  onRegisterBack,
  onOpenSettings,
  onOpenDemoPanel,
  onOpenSeries,
  seriesOpen = false,
  onCloseSeries,
  previewFixture = null,
  previewState = null,
}) {
  const [initialTodaySnapshot] = useState(
    () => previewFixture || (user ? peekTodaySnapshot(user.id) : null)
  )

  const [rituals, setRituals] = useState(() => initialTodaySnapshot?.rituals || [])

  const [ascezas, setAscezas] = useState(() => initialTodaySnapshot?.ascezas || [])

  const [loading, setLoading] = useState(() => !initialTodaySnapshot)

  const [loadError, setLoadError] = useState(false)

  const [reloadToken, setReloadToken] = useState(0)

  const [thoughtOfDay] = useState(() => getDailyThought())

  const [checkin, setCheckin] = useState(() => initialTodaySnapshot?.checkin || null)

  const [checkinHistory, setCheckinHistory] = useState(
    () => initialTodaySnapshot?.checkinHistory || []
  )

  // Серия в шапке считается из истории + сегодняшнего чек-ина: история с
  // бэкенда может ещё не содержать запись за сегодня (карточка «Утро
  // отмечено» уже есть, а огонёк без числа — регрессия после #801).
  // Пока история не загружена, показываем последнее известное значение
  // серии этого пользователя (или огонь без числа), а не «1» от одного
  // сегодняшнего чек-ина.
  const [historyLoaded, setHistoryLoaded] = useState(() => Boolean(previewFixture))
  const [cachedStreak] = useState(() => (user?.id ? peekCachedStreak(user.id) : null))
  const [moodPractices, setMoodPractices] = useState([])
  const [practiceDays, setPracticeDays] = useState([])
  const activityDays = collectActivityDays({ rituals, ascezas, moodPractices, practiceDays })

  const streak = resolveDisplayedStreak({
    historyLoaded,
    history: checkinHistory,
    checkin,
    cachedStreak,
    activityDays,
  })

  useEffect(() => {
    if (previewFixture || !historyLoaded || !user?.id) return
    rememberStreak(user.id, streak)
  }, [previewFixture, historyLoaded, user?.id, streak])
  const [newBadge, setNewBadge] = useState(null)
  const [showSeriesTooltip, setShowSeriesTooltip] = useState(() =>
    Boolean(user?.id && shouldShowSeriesTooltip(user.id))
  )

  const [reviewHour, setReviewHour] = useState(
    () => initialTodaySnapshot?.settings?.review_hour ?? 19
  )

  const [theme, setTheme] = useState(() => pickCurrentTheme(initialTodaySnapshot?.themes))

  const [activeToday, setActiveToday] = useState(null)

  const [sub, setSub] = useState(initialSub)

  const [pathTab, setPathTab] = useState('path')

  const [todayVariant, setTodayVariant] = useState(INITIAL_TODAY_VARIANT)

  // MXL-STARTER-SET-001 v1 (issue #417): показываем picker только пока
  // пользователь явно не пропустил его в этой сессии — «пропустить» не
  // должно повторно всплывать при каждом ре-рендере Today.
  const [starterSetSkipped, setStarterSetSkipped] = useState(false)
  const [hiddenCardsRaw] = useSynced(TODAY_CARDS_HIDDEN_KEY, '[]')

  const [hintDismissed, setHintDismissed] = useSynced('mx-today-cards-hint-dismissed', 'false')
  const [cardsHintClosing, setCardsHintClosing] = useState(false)
  const cardsHintRef = useRef(null)

  // §6 Motion — сжатие карточки при возврате из чек-ина (260→233, 130 ms)
  const [cardCompressing, setCardCompressing] = useState(false)

  const [seriesTooltipClosing, setSeriesTooltipClosing] = useState(false)
  const seriesTooltipRef = useRef(null)

  // Подсказки показываются по одной: следующая — после закрытия предыдущей.
  const cardsHintEligible =
    (checkinHistory.length > 0 || (user?.demo && demoScenario() === 'Новый пользователь')) &&
    hintDismissed !== 'true'
  const visibleHint = pickVisibleTodayHint({
    series: showSeriesTooltip,
    cards: cardsHintEligible,
  })

  // Автозакрытие подсказок при прокрутке (как у Stoic): если подсказка
  // была видна и полностью ушла за верхний край — помечаем закрытой навсегда.
  useAutoDismissOnScroll(cardsHintRef, () => setHintDismissed('true'), visibleHint === 'cards')
  useAutoDismissOnScroll(
    seriesTooltipRef,
    () => {
      markSeriesTooltipSeen(user?.id)
      setShowSeriesTooltip(false)
    },
    visibleHint === 'series'
  )

  const hiddenCards = parseHiddenCards(hiddenCardsRaw)

  /*
   * Любой вложенный экран Today — это отдельный сценарий, а не
   * продолжение главной. Шапка с приветствием, переключателем
   * темы и аватаром там не нужна: человек уже внутри и знает,
   * где он. Возврат даёт системная кнопка Telegram.
   */
  const changeSub = useCallback(
    nextSub => {
      onFlowChange?.(Boolean(nextSub))

      if (returnFlowActive && nextSub === 'checkin') {
        onReturnFlowEvent?.('morning_action_started')
      }

      setSub(nextSub)
    },
    [onFlowChange, onReturnFlowEvent, returnFlowActive]
  )

  /*
   * §6 Motion — анимация закрытия слоя чек-ина (уезд вниз, 170 ms ease-in).
   * ref защищает от двойных нажатий во время анимации: слой не открывается
   * дважды, состояние не ломается. CSS-анимация запускается через data-атрибут
   * на портале, после таймаута — размонтирование.
   */
  const checkInExitingRef = useRef(false)

  const triggerCheckInExit = useCallback(callback => {
    if (checkInExitingRef.current) return
    checkInExitingRef.current = true

    const root = getFullscreenPortalTarget()
    if (root) root.setAttribute('data-fullscreen-exit', 'true')

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const duration = reducedMotion ? 150 : 170

    setTimeout(() => {
      if (root) root.removeAttribute('data-fullscreen-exit')
      checkInExitingRef.current = false
      callback()
    }, duration)
  }, [])

  /*
   * §6 Motion — анимация закрытия шторки серии (уезд вниз, 200 ms ease-in).
   */
  const seriesExitingRef = useRef(false)

  const triggerSeriesExit = useCallback(callback => {
    if (seriesExitingRef.current) return
    seriesExitingRef.current = true

    const root = getFullscreenPortalTarget()
    if (root) root.setAttribute('data-sheet-exit', 'true')

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const duration = reducedMotion ? 150 : 200

    setTimeout(() => {
      if (root) root.removeAttribute('data-sheet-exit')
      seriesExitingRef.current = false
      callback()
    }, duration)
  }, [])

  function retryTodayData() {
    if (!user) return

    invalidateTodayData(user.id)
    setLoadError(false)
    setLoading(true)
    setReloadToken(token => token + 1)
  }

  useEffect(() => {
    return () => {
      onFlowChange?.(false)
    }
  }, [onFlowChange])

  useEffect(() => {
    let handler
    if (seriesOpen) {
      handler = () => triggerSeriesExit(() => onCloseSeries())
    } else if (sub === 'checkin' || sub === 'evening' || sub === 'redoCheckin' || sub === 'redoReview') {
      handler = () => triggerCheckInExit(() => changeSub(null))
    } else if (sub) {
      handler = () => changeSub(null)
    } else {
      handler = null
    }

    onRegisterBack?.(handler)

    return () => onRegisterBack?.(null)
  }, [changeSub, onCloseSeries, onRegisterBack, seriesOpen, sub, triggerCheckInExit, triggerSeriesExit])

  async function refreshCheckin() {
    if (!user) return

    try {
      const current = await api.checkin.today(user.id)

      setCheckin(current)

      const history = await api.checkin.history(user.id, 90)
      setCheckinHistory(Array.isArray(history) ? history : [])
      setHistoryLoaded(true)
      const previousModel = buildSeriesViewModel({
        checkins: checkinHistory,
        rituals,
        ascezas,
        moodPractices,
        practiceDays,
      })
      const nextModel = buildSeriesViewModel({
        checkins: history,
        rituals,
        ascezas,
        moodPractices,
        practiceDays,
      })
      const unlocked = nextModel.badges.find(
        badge =>
          badge.done && !previousModel.badges.find(previous => previous.id === badge.id)?.done
      )

      invalidateTodayData(user.id)
      return { history, newBadge: unlocked || null }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (previewFixture) return undefined
    if (!user || sub !== null) {
      return
    }

    let active = true

    // Будим сервер заранее, не дожидаясь остального (Render free tier
    // спит: первый запрос после сна отвечает до 50 с).
    api.health.check().catch(() => {})

    ;(async () => {
      try {
        const {
          rituals: ritualsData,
          ascezas: ascezasData,
          checkin: checkinData,
          themes: themesData,
          settings: settingsData,
        } = await fetchTodayDataWithRetry(user.id, { force: Boolean(initialTodaySnapshot) })

        if (!active) return

        setLoadError(false)
        setTheme(pickCurrentTheme(themesData))

        api.pulse
          .today()
          .then(pulse => setActiveToday(pulse.active_today))
          .catch(() => {})

        setRituals(ritualsData)

        setAscezas(ascezasData)

        setCheckin(checkinData)

        api.checkin
          .history(user.id, 90)
          .then(history => {
            const safeHistory = Array.isArray(history) ? history : []
            setCheckinHistory(safeHistory)
            setHistoryLoaded(true)
          })
          .catch(error => {
            // Не глотаем молча: без истории огонёк серии в шапке
            // показывает 0 (регрессия после #801). В предупреждении —
            // только путь и статус, без персональных данных.
            console.warn('[Today] история чек-инов не загружена', {
              path: 'GET /api/checkin/history',
              status: error?.status ?? null,
            })

            setHistoryLoaded(true)
          })

        // Записи практики «Настроение» — нужны для серии (день засчитывается
        // по любой активности) и для плейсхолдера иллюстраций.
        api.moodPractices
          .list(user.id)
          .then(practices => {
            if (active) setMoodPractices(Array.isArray(practices) ? practices : [])
          })
          .catch(() => {
            if (active) setMoodPractices([])
          })

        // Дни с отметками практик (ритуалы/аскезы) за прошлые дни — для серии.
        // Эндпоинт в бэкенде в разработке: при 404/ошибке вернёт [].
        api.practiceDays
          .list(user.id)
          .then(days => {
            if (active) setPracticeDays(Array.isArray(days) ? days : [])
          })
          .catch(() => {
            if (active) setPracticeDays([])
          })

        setReviewHour(settingsData?.review_hour ?? 19)
      } catch (error) {
        console.error(error)
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [user, sub, initialTodaySnapshot, previewFixture, reloadToken])

  const hourNow = clockNow().getHours()

  const isReviewTime = hourNow >= reviewHour

  const derivedTodayState = checkin?.review_completed_at
    ? 'dayClosed'
    : isReviewTime
      ? 'reviewPending'
      : checkin
        ? 'dayInProgress'
        : 'checkinPending'

  const todayState = previewState || derivedTodayState

  // ============================================================
  // SERIES & BADGES
  // ============================================================

  if (seriesOpen) {
    return (
      <SeriesBadges
        user={user}
        onBack={() => triggerSeriesExit(() => onCloseSeries())}
        onOpenPractice={practice => {
          triggerSeriesExit(() => {
            onCloseSeries?.()
            onOpenPractice?.(practice)
          })
        }}
      />
    )
  }

  // ============================================================
  // ЧЕК-ИН / АНАЛИЗ ДНЯ
  // ============================================================

  if (sub === 'checkin' || sub === 'evening') {
    return (
      <CheckIn
        user={user}
        existing={checkin}
        mode={resolveCheckInMode({ sub, initialSub })}
        onDone={async () => {
          const result = await refreshCheckin()

          if (returnFlowActive) {
            await onReturnFlowEvent?.('morning_action_completed')
          }

          triggerCheckInExit(() => {
            changeSub(null)
            setCardCompressing(true)
            if (result?.newBadge) setNewBadge(result.newBadge)
            setTimeout(() => setCardCompressing(false), 130)
          })
        }}
      />
    )
  }

  if (sub === 'redoCheckin') {
    return (
      <CheckIn
        user={user}
        existing={checkin}
        mode="checkin"
        redo
        onDone={async () => {
          await refreshCheckin()
          triggerCheckInExit(() => changeSub(null))
        }}
      />
    )
  }

  if (sub === 'redoReview') {
    return (
      <CheckIn
        user={user}
        existing={checkin}
        mode="evening"
        redo
        onDone={async () => {
          await refreshCheckin()
          triggerCheckInExit(() => changeSub(null))
        }}
      />
    )
  }

  if (sub === 'checkinRecap' && checkin) {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
        <History
          user={user}
          initialSelectedDay={{ date: checkin.date, checkin }}
          onInitialBack={() => changeSub(null)}
          recapOnly
          onRedo={() => changeSub('redoCheckin')}
          onRedoReview={() => changeSub('redoReview')}
        />
      </div>
    )
  }

  // ============================================================
  // ТЕМА НЕДЕЛИ
  // ============================================================

  if (sub === 'theme' && theme) {
    return <ThemeScreen user={user} themeId={theme.id} onBack={() => changeSub(null)} />
  }

  // ============================================================
  // ЦИТАТЫ
  // ============================================================

  if (sub === 'quote') {
    return <QuoteView user={user} todayQuote={thoughtOfDay} onClose={() => changeSub(null)} />
  }

  // ============================================================
  // ПУТЬ / ИСТОРИЯ
  // ============================================================

  if (sub === 'path') {
    return (
      <div className="w-full flex flex-col items-center animate-fade-in">
        <div className="w-full max-w-md px-[var(--mx-screen-x)] pt-4 pb-3 flex items-center gap-3">
          <BackButton onClick={() => changeSub(null)} />

          <div className="flex-1 flex bg-emerald rounded-full p-1">
            {[
              ['path', 'Путь'],
              ['history', 'История'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  platform.haptic('light')

                  setPathTab(key)
                }}
                className={[
                  'flex-1 min-h-11 py-2 rounded-full text-[12px] font-bold border-0 transition-colors',
                  pathTab === key ? 'bg-cream/10 text-cream' : 'bg-transparent text-muted',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md px-[var(--mx-screen-x)]">
          <YearPath user={user} onContinueToday={() => changeSub(null)} />
        </div>

        {pathTab === 'path' ? (
          <Path user={user} onContinueToday={() => changeSub(null)} />
        ) : (
          <div className="w-full max-w-md px-[var(--mx-screen-x)]">
            <History
              user={user}
              onRedo={() => changeSub('redoCheckin')}
              onRedoReview={() => changeSub('redoReview')}
            />
          </div>
        )}
      </div>
    )
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    /*
     * Шапка остаётся на экране и во время загрузки дня: в Telegram
     * fullscreen верхнюю полосу занимает воркмарк MENTALIX, и без шапки
     * здесь огонёк серии исчезал из виду. До ответа API streak берётся
     * из кэша этого пользователя (streakCache.js), иначе огонь без числа.
     */
    return (
      <div className="mx-screen-shell">
        <h1 className="sr-only">Сегодня</h1>
        <TodayWorkspaceHeader
          onOpenSettings={onOpenSettings}
          onOpenDemoPanel={onOpenDemoPanel}
          onOpenSeries={onOpenSeries}
          streak={streak}
        />
        <p className="text-muted text-[13px] px-[var(--mx-screen-x)] pt-8">Загрузка...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-screen-shell">
        <h1 className="sr-only">Сегодня</h1>
        <TodayWorkspaceHeader
          onOpenSettings={onOpenSettings}
          onOpenDemoPanel={onOpenDemoPanel}
          onOpenSeries={onOpenSeries}
          streak={streak}
        />
        <div className="w-full max-w-md px-[var(--mx-screen-x)] pt-8">
          <EmptyState
            className="p-5"
            glyph={
              <img
                className="w-[120px] h-[138px] mx-auto mb-4 opacity-70"
                src={cardEveningDone2x}
                srcSet={`${cardEveningDone2x} 2x, ${cardEveningDone3x} 3x`}
                alt=""
                draggable={false}
              />
            }
          >
            <h2 className="font-display mx-type-card text-cream mb-1">Сервер просыпается</h2>
            <p className="mx-type-list-body text-muted mb-4" role="alert">
              Обычно это меньше минуты. Попробуй ещё раз.
            </p>
            <button onClick={retryTodayData} className="cta-pill mx-type-control px-7 py-3">
              Повторить
            </button>
          </EmptyState>
        </div>
      </div>
    )
  }

  // ============================================================
  // ДАННЫЕ ДНЯ
  // ============================================================

  const total = rituals.length + ascezas.length

  const done =
    rituals.filter(ritual => ritual.today_level).length +
    ascezas.filter(asceza => asceza.today_status).length

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const isEmpty = total === 0

  const checkinDone = Boolean(checkin)
  const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']
  // Contract compatibility: MOOD_WORDS[(checkin?.mood || 3) - 1]; legacy checkin.mood readers.

  const cardNow = clockNow()
  if (
    previewState === 'night' ||
    (import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get('today_state') === 'night')
  ) {
    cardNow.setHours(1, 30, 0, 0)
  }
  const cardStates = resolveTodayCardStates({ now: cardNow, reviewHour, checkin })
  const primaryKind = primaryCardKind(cardStates)
  const reviewTime = formatReviewTime(reviewHour)

  function renderDayCard(kind) {
    const isMorning = kind === 'morning'
    const state = cardStates[isMorning ? 'morning' : 'review']
    const isPrimary = primaryKind === kind
    const labelTop = isMorning ? 'Утренний' : 'Разбор'
    const labelBottom = isMorning ? 'чек-ин' : 'дня'
    const title = isMorning
      ? cardStates.isNight
        ? 'Вернись к началу вчера.'
        : 'Как ты сегодня?'
      : cardStates.isNight
        ? 'Подведи итог вчера.'
        : 'Закрой этот день.'
    const titleStart = isMorning
      ? cardStates.isNight
        ? 'Вернись к началу '
        : 'Как ты '
      : cardStates.isNight
        ? 'Подведи итог '
        : 'Закрой '
    const titleEmphasis = isMorning
      ? cardStates.isNight
        ? 'вчера.'
        : 'сегодня?'
      : cardStates.isNight
        ? 'вчера.'
        : 'этот день.'
    const completedText = isMorning ? 'Утро отмечено.' : 'День закрыт.'
    const lockedText = isMorning ? 'Утро прошло' : `Откроется в ${reviewTime}`

    const content =
      state === 'done' ? (
        <>
          <span className="mx-today-day-card__done">
            {isMorning ? (
              <>
                Утро
                <br />
                отмечено.
              </>
            ) : (
              <>
                День
                <br />
                закрыт.
              </>
            )}
          </span>
          <div className="mx-today-day-card__illustration" data-testid="today-card-illustration">
            <div className="mx-today-day-card__illustration-slot">
              <img
                className="mx-today-day-card__art"
                src={isMorning ? cardMorningDone2x : cardEveningDone2x}
                srcSet={`${isMorning ? cardMorningDone2x : cardEveningDone2x} 2x, ${isMorning ? cardMorningDone3x : cardEveningDone3x} 3x`}
                width={isMorning ? 200 : 200}
                height={isMorning ? 212 : 230}
                loading="lazy"
                alt=""
                draggable={false}
              />
            </div>
          </div>
        </>
      ) : state === 'active' ? (
        <>
          <span className="mx-today-day-card__label">
            {labelTop}
            <br />
            {labelBottom}
          </span>
          <span className="mx-today-day-card__title mx-type-checkin-title">
            {titleStart}
            <strong>{titleEmphasis}</strong>
          </span>
          <span className="mx-today-day-card__start" data-testid={`today-card-start-${kind}`}>
            Начать
          </span>
        </>
      ) : (
        <>
          <span className="mx-today-day-card__label">
            {labelTop}
            <br />
            {labelBottom}
          </span>
          <span className="mx-today-day-card__locked">{lockedText}</span>
        </>
      )

    const props = {
      className: 'mx-today-day-card animate-fade-in',
      'data-testid': `today-card-${kind}`,
      'data-kind': kind,
      'data-state': state,
      ...(isPrimary ? { 'data-primary': 'true' } : {}),
      'aria-label': `${labelTop} ${labelBottom}: ${
        state === 'locked' ? lockedText : state === 'done' ? completedText : title
      }`,
    }

    if (state === 'active' || state === 'done') {
      return (
        <button
          type="button"
          {...props}
          onClick={() => {
            platform.haptic('medium')
            changeSub(
              isMorning
                ? state === 'done'
                  ? 'checkinRecap'
                  : 'checkin'
                : state === 'done'
                  ? 'checkinRecap'
                  : 'evening'
            )
          }}
        >
          {content}
        </button>
      )
    }
    return (
      <div {...props} aria-disabled="true">
        {content}
      </div>
    )
  }

  const dayCards = (
    <div className="mx-today-day-cards" aria-label="Чек-ин дня">
      {renderDayCard('morning')}
      {renderDayCard('evening')}
    </div>
  )

  function changeTodayVariant(nextVariant) {
    setTodayVariant(nextVariant)

    const url = new URL(window.location.href)

    url.searchParams.set('today_variant', nextVariant)

    window.history.replaceState(null, '', url)
  }

  return (
    <div className={`mx-screen-shell${cardCompressing ? ' mx-screen-shell--compressing' : ''}`}>
      <h1 className="sr-only">Сегодня</h1>
      <TodayWorkspaceHeader
        onOpenSettings={onOpenSettings}
        onOpenDemoPanel={onOpenDemoPanel}
        onOpenSeries={onOpenSeries}
        streak={streak}
        onStreakClick={() => {
          markSeriesTooltipSeen(user?.id)
          setShowSeriesTooltip(false)
          onOpenSeries()
        }}
        onOpenHistory={() => {
          setPathTab('history')
          changeSub('path')
        }}
      />
      {visibleHint === 'series' && (
        <aside
          ref={seriesTooltipRef}
          className={`mx-today-series-tooltip${seriesTooltipClosing ? ' mx-today-series-tooltip--closing' : ''}`}
          role="status"
        >
          <button
            type="button"
            className="mx-tap-target"
            data-testid="series-tooltip-close"
            aria-label="Закрыть подсказку о серии"
            onClick={() => {
              setSeriesTooltipClosing(true)
              setTimeout(() => {
                markSeriesTooltipSeen(user?.id)
                setShowSeriesTooltip(false)
                setSeriesTooltipClosing(false)
              }, 200)
            }}
          >
            ×
          </button>
          <p>
            Это число — твоя <strong>серия</strong> чек-инов. Нажми, чтобы посмотреть значки.
          </p>
        </aside>
      )}
      {newBadge && <NewBadgeSheet badge={newBadge} onClose={() => setNewBadge(null)} />}
      <WeekStrip checkin={checkin} history={checkinHistory} />

      {TODAY_COMPARE_REQUESTED && (
        <TodayCompareControl mode={todayVariant} onChange={changeTodayVariant} />
      )}

      {/* Подсказка после первого чек-ина — монохромная плашка с ✕. */}
      {visibleHint === 'cards' && (
        <div
          ref={cardsHintRef}
          className={`mx-today-cards-hint${cardsHintClosing ? ' mx-today-cards-hint--closing' : ''}`}
          data-testid="today-cards-hint"
        >
          <Lightbulb size={20} className="mx-today-cards-hint__icon" aria-hidden="true" />
          <p>
            Две карточки ниже — твои ежедневные рефлексии: одна начинает день, другая подводит итог.
            Время разбора можно поменять в профиле.
          </p>
          <button
            type="button"
            className="mx-today-cards-hint__close mx-tap-target"
            data-testid="today-cards-hint-close"
            aria-label="Закрыть подсказку"
            onClick={() => {
              setCardsHintClosing(true)
              setTimeout(() => {
                setHintDismissed('true')
                setCardsHintClosing(false)
              }, 200)
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Две независимые карточки дня: утро и разбор (§5.1, тип A). */}
      <div className="mx-today-day-card-slot">{dayCards}</div>

      {/* ======================================================
          ПУЛЬС — только когда есть реальное число и хотя бы одна
          карточка не пройдена. Запасной текст убран.
          ====================================================== */}

      {!hiddenCards.includes('pulse') &&
        activeToday != null &&
        (cardStates.morning !== 'done' || cardStates.review !== 'done') && (
          <p className="mx-today-pulse">
            {activeToday < 20
              ? `Сегодня в пути вместе с тобой: ${activeToday}`
              : `Сегодня свой путь продолжили ${activeToday.toLocaleString('ru-RU')} человек`}
          </p>
        )}

      {/*
        mx-today-actions remains a documented maintenance contract. The legacy
        entry points Настроение, Записать мысль and Практика (onOpenPractice('journal'))
        are intentionally folded into Check-in/Journal rather than rendered as
        competing Today cards.
      */}

      {/* ======================================================
          ДЕНЬ

          Полоса измеряет сегодняшние практики, а не
          движение к целям. Раньше она называлась
          «Путь» и вела на экран целей: человек видел
          «100%», нажимал и попадал на «0% пройдено».
          Одно слово стояло над двумя разными метриками.

          Теперь имя совпадает с тем, что считается, а
          переход ведёт в Историю — ленту закрытых
          дней. Цели остались там же, соседней вкладкой.
          ====================================================== */}

      {LEGACY_TODAY_SUMMARY_CARDS_ENABLED &&
        (isEmpty ? (
          <EmptyState className="mt-4 p-5 [&>div:first-child]:mb-3 [&>div:first-child]:h-12 [&>div:first-child]:w-12">
            {!STARTER_SET_ENABLED || starterSetSkipped ? (
              <>
                <h3 className="font-display mx-type-card text-cream mb-1">Пока нет практик</h3>
                <p className="mx-type-list-body text-muted mb-4">
                  Добавь ритуал или аскезу — здесь появится прогресс дня.
                </p>
                <button
                  onClick={() => {
                    platform.haptic('light')

                    onOpenPractice?.()
                  }}
                  className="cta-pill mx-type-flow-action px-9 py-3.5"
                >
                  Выбрать практику
                </button>
              </>
            ) : (
              <StarterSetPicker
                user={user}
                onSkip={() => setStarterSetSkipped(true)}
                onCreated={ritual => {
                  setRituals(prev => [...prev, ritual])
                  invalidateTodayData(user.id)
                }}
              />
            )}
          </EmptyState>
        ) : (
          <button
            onClick={() => {
              platform.haptic('light')

              setPathTab('history')

              changeSub('path')
            }}
            className="w-full rounded-3xl bg-emerald px-[var(--mx-screen-x)] py-4 mt-8 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
          >
            <ArrowUpRight
              size={18}
              className="text-gold shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />

            <span className="mx-type-list-title text-cream whitespace-nowrap">День</span>

            <div className="flex-1 h-[5px] rounded-full bg-cream/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{
                  width: `${pct}%`,
                }}
              />
            </div>

            <span className="mx-type-flow-action text-gold whitespace-nowrap">
              {done} из {total}
            </span>

            <ChevronRight size={18} className="text-faint shrink-0" aria-hidden="true" />
          </button>
        ))}

      {LEGACY_TODAY_SUMMARY_CARDS_ENABLED && checkinDone && (
        <button
          onClick={() => {
            platform.haptic('light')

            changeSub('checkin')
          }}
          className="w-full rounded-3xl bg-emerald/60 px-[var(--mx-screen-x)] py-3 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
        >
          <span className="w-9 h-9 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[13px] font-bold shrink-0">
            ✓
          </span>

          <span className="flex-1 text-left">
            <span className="block mx-type-list-title text-cream">
              {todayState === 'dayClosed' ? 'День разобран' : 'Чек-ин выполнен'}
            </span>

            <span className="block mx-type-meta text-muted">
              {checkin.emotion ? `${checkin.emotion} · ` : ''}
              настроение: {MOOD_WORDS[(checkin?.mood || 3) - 1]}
            </span>
          </span>

          <span className="mx-type-meta text-muted shrink-0">изменить</span>
        </button>
      )}

      <PinnedPractices user={user} onOpenPractice={onOpenPractice} rituals={rituals} ascezas={ascezas} />

      {/* ======================================================
          ТЕМА НЕДЕЛИ
          ====================================================== */}

      {theme && !hiddenCards.includes('theme') && (
        <button
          onClick={() => {
            platform.haptic('light')

            changeSub('theme')
          }}
          className="mx-today-theme-card w-full px-[var(--mx-screen-x)] py-5 mt-4 text-center active:scale-[0.99] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] animate-fade-in"
        >
          <span className="block font-label mx-type-meta text-muted uppercase tracking-wider mb-2">
            Тема недели
          </span>

          <span className="block font-display mx-type-card text-cream lowercase">
            {theme.title}
          </span>

          <span className="block mx-type-list-body text-muted mt-2">{theme.subtitle}</span>

          <span className="flex items-center justify-center gap-1.5 mt-4" aria-hidden="true">
            {Array.from({
              length: theme.total_days,
            }).map((_, index) => (
              <span
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index < theme.reflected_days ? 'bg-gold' : 'bg-cream/15'
                }`}
              />
            ))}
          </span>

          <span className="block mx-type-meta text-muted mt-3">
            {theme.reflected_days > 0
              ? `Пройдено дней: ${theme.reflected_days} из ${theme.total_days}`
              : 'Начать неделю'}
          </span>
        </button>
      )}

      {/*
        Кнопка «+» убрана с экрана: те же действия уже
        доступны из карточек Today и нижней навигации, а
        плавающая кнопка добавляла третий способ сделать
        то же самое. Компонент QuickAdd оставлен в коде.
      */}

      {/* ======================================================
          МЫСЛЬ ДНЯ
          ====================================================== */}

      {!hiddenCards.includes('quote') && thoughtOfDay && (
        <button
          onClick={() => {
            platform.haptic('light')

            changeSub('quote')
          }}
          className="mx-today-affirmation-card w-full px-[var(--mx-screen-x)] py-6 mt-5 text-center animate-fade-in border-0 active:scale-[0.99] transition-transform"
        >
          <span className="block mx-type-meta text-muted mb-3">Мысль дня</span>

          <span className="block font-display mx-type-card text-cream">{thoughtOfDay.text}</span>
        </button>
      )}
    </div>
  )
}
