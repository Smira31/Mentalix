import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { platform, platformName } from '../platform'
import { useAutoDismissOnScroll } from '../lib/useAutoDismissOnScroll'
import { api } from '../lib/api'
import { logEngagementEvent } from '../lib/engagementEvents'
import {
  fetchTodayDataWithRetry,
  invalidateTodayData,
  peekTodaySnapshot,
} from '../lib/todayDataCache'
import { useTabRefresh } from '../lib/tabRefresh'
import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { ChevronRight, ArrowUpRight, Lightbulb, X } from 'lucide-react'

import './Today.css'

import BackButton from '../components/BackButton'
import cardEveningDone2x from '../assets/today/card-evening-done@2x.webp'
import cardEveningDone3x from '../assets/today/card-evening-done@3x.webp'

import EmptyState from '../components/EmptyState'
import StarterSetPicker from '../components/StarterSetPicker'
import PinnedPractices from '../components/PinnedPractices'
import GuestSaveReminder from '../components/GuestSaveReminder'
import { useSynced } from '../lib/store'
import { getDailyThought } from '../data/dailyThoughts'
import { TODAY_CARDS_HIDDEN_KEY, parseHiddenCards } from '../lib/todayCardVisibility'
import { peekThemeDetail, fetchThemeDetail } from '../lib/themeDetailCache'
import { TodayCompareControl } from '../components/TodayMotionExperiment'
import { readCanonicalStreakStats } from '../lib/canonicalStreak'
import { peekStreakSnapshot, saveStreakSnapshot } from '../lib/streakSnapshotCache'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import SubScreenBoundary from '../components/SubScreenBoundary'
import {
  buildServerSeriesViewModel,
  splitCheckinsForComparison,
  detectNewlyUnlockedBadge,
} from '../lib/series'
import { markSeriesTooltipSeen, shouldShowSeriesTooltip } from '../lib/seriesPreferences'
import { resolveCheckInMode } from '../lib/todayCheckinMode'
import { resolveContextualCheckin } from '../lib/contextualDeepLink'
import {
  formatReviewTime,
  resolveTodayCardStates,
  primaryCardKind,
  DEFAULT_REVIEW_HOUR,
} from '../lib/todayCardState'
import { now as clockNow } from '../lib/clock'
import { demoScenario, demoReviewNow, previewPinnedPracticesAction } from '../lib/demoMode'
import { pickVisibleTodayHint } from '../lib/todayHints'

/* ============================================================
   LAZY SUB-SCREENS
   Тяжёлые под-экраны Today (чек-ин, история, тема, путь, цитаты,
   дыхание, восстановление серии, значки) грузятся только при
   переходе. Стартовый bundle содержит только главный экран «Сегодня».
   ============================================================ */

const Path = lazyWithRetry(() => import('./Path'))
const YearPath = lazyWithRetry(() => import('./YearPath'))
const CheckIn = lazyWithRetry(() => import('./CheckIn'))
const ThemeScreen = lazyWithRetry(() => import('./ThemeScreen'))
const ThemeCarouselScreen = lazyWithRetry(() => import('./ThemeCarouselScreen'))
const History = lazyWithRetry(() => import('./History'))
const QuoteView = lazyWithRetry(() => import('./QuoteView'))
const DailyThoughtScreen = lazyWithRetry(() => import('./DailyThoughtScreen'))
const BreathingPractice = lazyWithRetry(() => import('./BreathingPractice'))
const StreakRecovery = lazyWithRetry(() => import('./StreakRecovery'))
const SeriesBadges = lazyWithRetry(() => import('./SeriesBadges'))
const NewBadgeSheet = lazyWithRetry(() =>
  import('./SeriesBadges').then(m => ({ default: m.NewBadgeSheet }))
)

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

// §6 Motion: подсписок subs, закрытие которых анимируется уездом слоя вниз.
const CHECKIN_SUBS = ['checkin', 'evening', 'redoCheckin', 'redoReview', 'recoveryReview']

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

function TodayWorkspaceHeader({
  onOpenSettings,
  onOpenSeries,
  onOpenDemoPanel,
  streak = 0,
  isActiveToday = false,
  onStreakClick,
}) {
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
        className={`mx-demo-today-streak${streak === 0 && !isActiveToday ? ' mx-demo-today-streak--empty' : ''}`}
        aria-label={streakLabel}
        onClick={onStreakClick || onOpenSeries}
      >
        <ReferenceFlame />
        {streak > 0 && <strong>{streak}</strong>}
      </button>
      <strong
        className="mx-demo-today-greeting"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onPointerLeave={endPress}
      >
        {todayGreeting()}
      </strong>
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

function WeekStrip({ streakStats }) {
  const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const now = clockNow()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return day
  })

  // Сервер не передаёт дату заморозки — показываем её отдельным состоянием,
  // не приписывая произвольному календарному дню.

  return (
    <div className="mx-today-week" role="group" aria-label="Календарь недели">
      <div className="mx-today-week__calendar">
        {days.map(day => {
          const isToday = day.toDateString() === now.toDateString()
          const isCompleted = isToday && streakStats?.isActiveToday === true
          return (
            <div
              key={day.getTime()}
              className="mx-today-week-day"
              data-testid="today-week-day"
              data-today={isToday}
              data-completed={isCompleted}
              aria-label={`${names[day.getDay() === 0 ? 6 : day.getDay() - 1]}: ${isCompleted ? 'активный день' : 'нет данных об активности'}`}
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
  returnFlowActive = null,
  onReturnFlowEvent,
  onFlowChange,
  onRegisterBack,
  onOpenSettings,
  onOpenDemoPanel,
  onOpenSeries,
  onGoMentor,
  seriesOpen = false,
  onCloseSeries,
  previewFixture = null,
  previewState = null,
  recoveryAllowed = true,
}) {
  const [initialTodaySnapshot] = useState(
    () => previewFixture || (user ? peekTodaySnapshot(user.id) : null)
  )

  const [rituals, setRituals] = useState(() => initialTodaySnapshot?.rituals || [])

  const [ascezas, setAscezas] = useState(() => initialTodaySnapshot?.ascezas || [])

  // На холодном старте без снимка показываем скелетон («Загрузка…»),
  // а не пустой экран без обратной связи. После 2 с скелетон сменяется
  // экраном «Сегодня» с ненавязчивым «Подключаемся…» — данные
  // подтягиваются в фоне, вечного экрана загрузки нет.
  // contextualCheckin требует checkin до выбора режима — для него
  // скелетон остаётся до ответа API.
  const [loading, setLoading] = useState(
    () => !previewFixture && (initialSub === 'contextualCheckin' || !initialTodaySnapshot)
  )

  // «Подключаемся…» — ненавязчивый индикатор после перехода со скелетона
  // на экран «Сегодня», пока сервер ещё не ответил (Render free спит).
  const [connecting, setConnecting] = useState(false)

  const [loadError, setLoadError] = useState(false)

  const [reloadToken, setReloadToken] = useState(0)

  // Тихое фоновое обновление при возврате на вкладку из фона или
  // другой вкладки: инвалидируем кеш и перезапускаем основной эффект.
  // Скелетон и loading не показываются — эффект не ставит loading
  // в true, только обновляет state по готовности свежих данных.
  useTabRefresh('today', () => {
    if (!user) return
    invalidateTodayData(user.id)
    setReloadToken(token => token + 1)
  })

  const [recovery, setRecovery] = useState(null)
  const [recoveryStage, setRecoveryStage] = useState('offer')
  const recoveryRequested = useRef(null)
  const recoveryCompleted = useRef(false)

  const recoveryEvent = useCallback(
    (event, date) => {
      logEngagementEvent({
        user,
        demo: Boolean(user?.demo),
        event,
        entityType: 'streak_recovery',
        entityId: date,
        hasSession: Boolean(platform.getSessionToken?.()),
        send: api.events.log,
      })
    },
    [user]
  )

  function dismissRecovery() {
    if (recovery?.date) {
      try {
        localStorage.setItem(`mx-streak-recovery-dismissed:${user.id}:${recovery.date}`, '1')
      } catch {
        /* */
      }
      recoveryEvent('streak_recovery_dismissed', recovery.date)
    }
    setRecovery(null)
  }

  const [thoughtOfDay] = useState(() => getDailyThought())

  const [checkin, setCheckin] = useState(() => initialTodaySnapshot?.checkin || null)

  const [checkinHistory, setCheckinHistory] = useState(
    () => initialTodaySnapshot?.checkinHistory || []
  )

  // Сервер владеет календарной границей и правилом заморозки.
  // Персистентный снимок серии (streakSnapshotCache.js) — огонёк в шапке
  // сразу с числом, без пустого кадра на каждый переход на вкладку.
  const [canonicalStreak, setCanonicalStreak] = useState(() => peekStreakSnapshot(user?.id))
  const [moodPractices, setMoodPractices] = useState([])
  const canonical = canonicalStreak?.userId === user?.id ? canonicalStreak.value : null
  const streak = canonical?.currentStreak ?? null
  const streakRequest = useRef(0)
  const refreshStreak = useCallback(() => {
    if (!user?.id) return
    const requestId = ++streakRequest.current
    api
      .streak(user.id)
      .then(payload => {
        if (requestId !== streakRequest.current) return
        const value = readCanonicalStreakStats(payload)
        saveStreakSnapshot(user.id, value)
        setCanonicalStreak({ userId: user.id, value })
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    const activitySaved = event => {
      if (event.detail?.userId != null && String(event.detail.userId) !== String(user?.id)) return
      setCanonicalStreak(previous => ({
        userId: user.id,
        value: { ...(previous?.userId === user.id ? previous.value : null), isActiveToday: true },
      }))
      refreshStreak()
    }
    window.addEventListener('mentalix:activity-saved', activitySaved)
    return () => window.removeEventListener('mentalix:activity-saved', activitySaved)
  }, [refreshStreak, user?.id])
  const [newBadge, setNewBadge] = useState(null)
  const returnFlowCompleted = useRef(false)
  useEffect(() => {
    if (
      returnFlowActive &&
      initialSub === (returnFlowActive === 'evening_v1' ? 'evening' : 'checkin')
    ) {
      onReturnFlowEvent?.('action_started')
    }
  }, [returnFlowActive, initialSub, onReturnFlowEvent])
  useEffect(() => {
    if (!newBadge?.id) return
    logEngagementEvent({
      user,
      demo: Boolean(user?.demo),
      event: 'badge_earned',
      entityType: 'badge',
      entityId: newBadge.id,
      once: newBadge.id,
      hasSession: Boolean(platform.getSessionToken?.()),
      send: api.events.log,
    })
  }, [newBadge, user])
  const [showSeriesTooltip, setShowSeriesTooltip] = useState(() =>
    Boolean(user?.id && shouldShowSeriesTooltip(user.id))
  )

  const [reviewHour, setReviewHour] = useState(
    () => initialTodaySnapshot?.settings?.review_hour ?? DEFAULT_REVIEW_HOUR
  )

  const [theme, setTheme] = useState(() => pickCurrentTheme(initialTodaySnapshot?.themes))

  // Детали темы (days[], current_day) для карточки «Тема недели» —
  // список из todayDataCache не содержит days; нужен отдельный запрос.
  const [themeDetail, setThemeDetail] = useState(() =>
    theme ? peekThemeDetail(user?.id, theme.id) : null
  )

  // День, на который переходит прямой тап по карточке («Записать»).
  const [themeWriteDay, setThemeWriteDay] = useState(1)

  // activeToday показывается сразу из sessionStorage (если уже был),
  // обновляется в фоне. Резерв высоты исключает сдвиг контента.
  const [activeToday, setActiveToday] = useState(() => {
    if (!user?.id) return null
    try {
      const cached = sessionStorage.getItem(`mx-pulse-today:${user.id}`)
      return cached != null ? Number(cached) : null
    } catch {
      return null
    }
  })

  const [sub, setSub] = useState(initialSub)
  const activeSub =
    sub === 'contextualCheckin'
      ? resolveContextualCheckin({ now: clockNow(), reviewHour, checkin })
      : sub

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
  /*
   * Какая карточка дня открыла recap: меню повтора на recap контекстно —
   * у утренней карточки «Пройти утро заново», у вечерней «День закрыт» —
   * только «Пройти разбор заново».
   */
  const [recapSource, setRecapSource] = useState('morning')

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

      if (
        returnFlowActive &&
        nextSub === (returnFlowActive === 'evening_v1' ? 'evening' : 'checkin')
      ) {
        onReturnFlowEvent?.('action_started')
      }
      if (returnFlowActive && !nextSub && !returnFlowCompleted.current) {
        onReturnFlowEvent?.('flow_skipped')
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
    setConnecting(false)
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
    } else if (CHECKIN_SUBS.includes(activeSub)) {
      handler = () => triggerCheckInExit(() => changeSub(null))
    } else if (activeSub) {
      handler = () => changeSub(null)
    } else {
      handler = null
    }

    onRegisterBack?.(handler)

    return () => onRegisterBack?.(null)
  }, [
    changeSub,
    onCloseSeries,
    onRegisterBack,
    seriesOpen,
    activeSub,
    triggerCheckInExit,
    triggerSeriesExit,
  ])

  async function refreshCheckin() {
    if (!user) return

    try {
      const { checkin: current } = await fetchTodayDataWithRetry(user.id, { force: true })

      setCheckin(current)

      const [historyResult, streakResult] = await Promise.allSettled([
        api.checkin.history(user.id, 90),
        api.streak(user.id),
      ])

      if (streakResult.status === 'fulfilled') {
        const streakValue = readCanonicalStreakStats(streakResult.value)
        saveStreakSnapshot(user.id, streakValue)
        setCanonicalStreak({ userId: user.id, value: streakValue })
      }

      if (historyResult.status === 'rejected') throw historyResult.reason

      const safeHistory = Array.isArray(historyResult.value) ? historyResult.value : []
      setCheckinHistory(safeHistory)

      // Обе модели строятся из одной свежей истории: previous — без
      // сегодняшнего чек-ина, next — с ним. Ретро-значки (полученные
      // задним числом из исторических данных) открыты в обеих моделях
      // и не запускают шторку; шторка — только для значков, открытых
      // именно новым чек-ином.
      const { previous, next } = splitCheckinsForComparison(safeHistory, current)
      const previousModel = buildServerSeriesViewModel({
        checkins: previous,
        rituals,
        ascezas,
      })
      const nextModel = buildServerSeriesViewModel({
        checkins: next,
        rituals,
        ascezas,
      })
      const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
      // Числа и пороги серии здесь не выводятся из истории чек-инов.
      const serverBadge =
        unlocked?.id?.startsWith('streak-') ||
        unlocked?.id === 'week-on-path' ||
        unlocked?.id === 'month-on-path'
          ? null
          : unlocked

      invalidateTodayData(user.id)
      return { history: safeHistory, newBadge: serverBadge }
    } catch (error) {
      console.error(error)
    }
  }

  // Повтор открывает пустую форму; запись дня не меняется до сохранения.
  const handleRedoMorning = useCallback(() => {
    platform.haptic('light')
    changeSub('redoCheckin')
  }, [changeSub])

  // Скелетон («Загрузка…») показывается не дольше 2 с: после этого —
  // экран «Сегодня» с ненавязчивым «Подключаемся…», данные
  // подтягиваются в фоне. Не применяется при наличии снимка (данные
  // уже есть — скелетон не нужен) и для contextualCheckin (нужен
  // checkin до выбора режима — ждём ответа API).
  useEffect(() => {
    if (!loading || previewFixture || initialTodaySnapshot) return undefined
    if (initialSub === 'contextualCheckin') return undefined
    const timer = setTimeout(() => {
      setLoading(false)
      setConnecting(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [loading, previewFixture, initialTodaySnapshot, initialSub])

  useEffect(() => {
    if (previewFixture) return undefined
    if (!user || (sub !== null && !initialSub)) {
      return
    }

    let active = true

    // Будим сервер заранее, не дожидаясь остального (Render free tier
    // спит: первый запрос после сна отвечает до 50 с).
    api.health.check().catch(() => {})

    refreshStreak()

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

        // Подгружаем детали текущей темы (days[], current_day) для
        // карточки «Тема недели»: список тем не содержит days.
        const currentTheme = pickCurrentTheme(themesData)
        if (currentTheme?.id) {
          fetchThemeDetail(user.id, currentTheme.id)
            .then(d => {
              if (active && d) setThemeDetail(d)
            })
            .catch(() => {})
        }

        api.pulse
          .today()
          .then(pulse => {
            setActiveToday(pulse.active_today)
            try {
              sessionStorage.setItem(`mx-pulse-today:${user.id}`, String(pulse.active_today))
            } catch {
              /* sessionStorage может быть недоступен */
            }
          })
          .catch(() => {})

        setRituals(ritualsData)

        setAscezas(ascezasData)

        setCheckin(checkinData)

        api.checkin
          .history(user.id, 90)
          .then(history => {
            const safeHistory = Array.isArray(history) ? history : []
            setCheckinHistory(safeHistory)
          })
          .catch(error => {
            // Не глотаем молча: без истории огонёк серии в шапке
            // показывает 0 (регрессия после #801). В предупреждении —
            // только путь и статус, без персональных данных.
            console.warn('[Today] история чек-инов не загружена', {
              path: 'GET /api/checkin/history',
              status: error?.status ?? null,
            })
          })

        api.moodPractices
          .list(user.id)
          .then(items => {
            if (active) setMoodPractices(Array.isArray(items) ? items : [])
          })
          .catch(() => {})

        setReviewHour(settingsData?.review_hour ?? DEFAULT_REVIEW_HOUR)
      } catch (error) {
        console.error(error)
        // Экран ошибки — только при холодном старте без снимка:
        // если данные уже есть (из снимка), сохраняем их, а не
        // заменяем экраном «Сервер просыпается».
        if (active && !initialTodaySnapshot) setLoadError(true)
      } finally {
        if (active) {
          setLoading(false)
          setConnecting(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [user, sub, initialSub, initialTodaySnapshot, previewFixture, reloadToken, refreshStreak])

  useEffect(() => {
    if (
      !recoveryAllowed ||
      loading ||
      loadError ||
      !user?.id ||
      initialSub ||
      sub ||
      !canonical?.recoverable ||
      recoveryRequested.current === user.id
    )
      return
    recoveryRequested.current = user.id
    let active = true
    api.checkin
      .recovery(user.id)
      .then(result => {
        if (!active || !canonical?.recoverable || !result?.recoverable || !result.date) return
        try {
          if (
            localStorage.getItem(`mx-streak-recovery-dismissed:${user.id}:${result.date}`) === '1'
          )
            return
        } catch {
          /* storage unavailable */
        }
        setRecovery(result)
        recoveryEvent('streak_recovery_shown', result.date)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [
    recoveryAllowed,
    loading,
    loadError,
    user,
    initialSub,
    sub,
    recoveryEvent,
    canonical?.recoverable,
  ])

  const hourNow = demoReviewNow(reviewHour).getHours()

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

  const seriesSheet = seriesOpen ? (
    <Suspense fallback={null}>
      <SeriesBadges
        user={user}
        onBack={onCloseSeries}
        onOpenPractice={practice => {
          onCloseSeries?.()
          if (practice === 'checkin') changeSub('checkin')
          else onOpenPractice?.(practice)
        }}
      />
    </Suspense>
  ) : null

  // ============================================================
  // ЧЕК-ИН / АНАЛИЗ ДНЯ
  // ============================================================

  if (activeSub === 'breathing') {
    return (
      <SubScreenBoundary resetKey="breathing" onExit={() => changeSub(null)}>
        <BreathingPractice onBack={() => changeSub(null)} />
      </SubScreenBoundary>
    )
  }

  if (activeSub === 'recoveryReview' && recovery) {
    return (
      <SubScreenBoundary resetKey="recoveryReview" onExit={() => changeSub(null)}>
        <CheckIn
          user={user}
          mode="evening"
          recovery={recovery}
          onRecoveryExpired={() => {
            changeSub(null)
            setRecoveryStage('expired')
          }}
          onCompleted={() => {
            recoveryCompleted.current = true
            changeSub(null)
            setRecoveryStage('saved')
            refreshCheckin()
          }}
          onDone={() => {
            if (!recoveryCompleted.current) {
              changeSub(null)
              setRecovery(null)
            }
          }}
        />
      </SubScreenBoundary>
    )
  }

  if (!loading && !loadError && (activeSub === 'checkin' || activeSub === 'evening')) {
    return (
      <SubScreenBoundary resetKey={activeSub} onExit={() => changeSub(null)}>
        <CheckIn
          user={user}
          existing={checkin}
          mode={resolveCheckInMode({ sub: activeSub, initialSub })}
          onCompleted={() => {
            returnFlowCompleted.current = true
            if (returnFlowActive) onReturnFlowEvent?.('action_completed')
          }}
          onDone={async () => {
            const result = await refreshCheckin()

            triggerCheckInExit(() => {
              changeSub(null)
              setCardCompressing(true)
              if (result?.newBadge) setNewBadge(result.newBadge)
              setTimeout(() => setCardCompressing(false), 130)
            })
          }}
        />
      </SubScreenBoundary>
    )
  }

  if (sub === 'redoCheckin') {
    return (
      <SubScreenBoundary resetKey="redoCheckin" onExit={() => changeSub(null)}>
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
      </SubScreenBoundary>
    )
  }

  if (sub === 'redoReview') {
    return (
      <SubScreenBoundary resetKey="redoReview" onExit={() => changeSub(null)}>
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
      </SubScreenBoundary>
    )
  }

  if (sub === 'checkinRecap' && checkin) {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
        <SubScreenBoundary resetKey="checkinRecap" onExit={() => changeSub(null)}>
          <History
            user={user}
            initialSelectedDay={{ date: checkin.date, checkin }}
            onInitialBack={() => changeSub(null)}
            recapOnly
            onRedo={recapSource === 'morning' ? handleRedoMorning : null}
            onRedoReview={recapSource === 'evening' ? () => changeSub('redoReview') : null}
          />
        </SubScreenBoundary>
      </div>
    )
  }

  // ============================================================
  // ТЕМА НЕДЕЛИ
  // ============================================================

  if (sub === 'theme' && theme) {
    return (
      <SubScreenBoundary resetKey="theme" onExit={() => changeSub(null)}>
        <ThemeCarouselScreen user={user} themeId={theme.id} onBack={() => changeSub(null)} />
      </SubScreenBoundary>
    )
  }

  // Прямой переход из карточки «Тема недели» на «Сегодня» → экран записи
  // ответа на ждущий вопрос (ThemeScreen с initialDay).
  if (sub === 'themeWrite' && theme) {
    return (
      <SubScreenBoundary resetKey="themeWrite" onExit={() => changeSub(null)}>
        <ThemeScreen
          user={user}
          themeId={theme.id}
          initialDay={themeWriteDay}
          onBack={() => changeSub(null)}
        />
      </SubScreenBoundary>
    )
  }

  // ============================================================
  // ЦИТАТЫ
  // ============================================================

  if (sub === 'quote') {
    return (
      <SubScreenBoundary resetKey="quote" onExit={() => changeSub(null)}>
        <QuoteView user={user} todayQuote={thoughtOfDay} onClose={() => changeSub(null)} />
      </SubScreenBoundary>
    )
  }

  // ============================================================
  // МЫСЛЬ ДНЯ — Stoic-экран (без загрузки, текст уже в карточке)
  // ============================================================

  if (sub === 'dailyThought') {
    return (
      <SubScreenBoundary resetKey="dailyThought" onExit={() => changeSub(null)}>
        <Suspense fallback={null}>
          <DailyThoughtScreen
            thought={thoughtOfDay}
            user={user}
            onClose={() => changeSub(null)}
            onGoMentor={onGoMentor}
          />
        </Suspense>
      </SubScreenBoundary>
    )
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

        <SubScreenBoundary resetKey="path" onExit={() => changeSub(null)}>
          <div className="w-full max-w-md px-[var(--mx-screen-x)]">
            <YearPath user={user} onContinueToday={() => changeSub(null)} />
          </div>

          {pathTab === 'path' ? (
            <Path user={user} onContinueToday={() => changeSub(null)} />
          ) : (
            <div className="w-full max-w-md px-[var(--mx-screen-x)]">
              <History
                user={user}
                onRedo={handleRedoMorning}
                onRedoReview={() => changeSub('redoReview')}
              />
            </div>
          )}
        </SubScreenBoundary>
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
     * здесь огонёк серии исчезал из виду. Число серии приходит только
     * из GET /api/streak; до ответа сервера огонь без числа.
     */
    return (
      <div className="mx-screen-shell">
        <h1 className="sr-only">Сегодня</h1>
        {seriesSheet}
        <TodayWorkspaceHeader
          onOpenSettings={onOpenSettings}
          onOpenDemoPanel={onOpenDemoPanel}
          onOpenSeries={onOpenSeries}
          streak={streak}
          isActiveToday={canonical?.isActiveToday === true}
        />
        <p className="text-muted text-[13px] px-[var(--mx-screen-x)] pt-8">Загрузка...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-screen-shell">
        <h1 className="sr-only">Сегодня</h1>
        {seriesSheet}
        <TodayWorkspaceHeader
          onOpenSettings={onOpenSettings}
          onOpenDemoPanel={onOpenDemoPanel}
          onOpenSeries={onOpenSeries}
          streak={streak}
          isActiveToday={canonical?.isActiveToday === true}
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

  const cardNow = demoReviewNow(reviewHour)
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
            setRecapSource(isMorning ? 'morning' : 'evening')
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

  // ── Тема недели: ждущий вопрос для карточки ──
  // themeDetail (days[], current_day) может прийти из кеша или
  // отдельного запроса; theme.days — из демо-данных todayDataCache.
  const themeDays = themeDetail?.days || theme?.days || []
  const themeCurrentDay = themeDetail?.current_day ?? theme?.current_day ?? 1
  const themeWaitingDay = (() => {
    if (!themeDays.length) return null
    const today = themeDays.find(d => d.day === themeCurrentDay)
    if (today && !today.reflection) return today
    return themeDays.find(d => !d.reflection) || null
  })()
  const themeAllAnswered = themeDays.length > 0 && themeDays.every(d => d.reflection)
  const themeDayLabel = `День ${themeWaitingDay?.day || themeCurrentDay} из ${theme?.total_days || 7}`
  const themeQuestionText = themeWaitingDay?.text || ''
  const themeCtaLabel = themeAllAnswered ? 'Смотреть в пути' : 'Записать'

  function handleThemeCardTap() {
    platform.haptic('light')
    if (themeAllAnswered || !themeWaitingDay) {
      changeSub('theme')
    } else {
      setThemeWriteDay(themeWaitingDay.day)
      changeSub('themeWrite')
    }
  }

  return (
    <div className={`mx-screen-shell${cardCompressing ? ' mx-screen-shell--compressing' : ''}`}>
      <h1 className="sr-only">Сегодня</h1>
      {seriesSheet}
      {recovery && recoveryStage !== 'offer' && (
        <SubScreenBoundary resetKey={recoveryStage} onExit={dismissRecovery}>
          <StreakRecovery
            recovery={recovery}
            stage={recoveryStage}
            onDismiss={dismissRecovery}
            onStart={() => {
              recoveryEvent('streak_recovery_started', recovery.date)
              changeSub('recoveryReview')
            }}
            onClose={() => {
              setRecovery(null)
              setRecoveryStage('offer')
            }}
          />
        </SubScreenBoundary>
      )}
      <TodayWorkspaceHeader
        onOpenSettings={onOpenSettings}
        onOpenDemoPanel={onOpenDemoPanel}
        onOpenSeries={onOpenSeries}
        streak={streak}
        isActiveToday={canonical?.isActiveToday === true}
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
      {connecting && (
        <p
          className="mx-today-connecting mx-type-meta text-muted"
          role="status"
          data-testid="today-connecting"
        >
          Подключаемся…
        </p>
      )}
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
            Это число — твоя <strong>серия</strong> активных дней. Нажми, чтобы посмотреть значки.
          </p>
        </aside>
      )}
      {newBadge && (
        <SubScreenBoundary resetKey="new-badge" onExit={() => setNewBadge(null)}>
          <NewBadgeSheet badge={newBadge} onClose={() => setNewBadge(null)} />
        </SubScreenBoundary>
      )}
      <WeekStrip streakStats={canonical} />
      {recovery && recoveryStage === 'offer' && canonical?.recoverable && (
        <button
          type="button"
          className="mx-today-recovery-banner"
          data-testid="streak-recovery-banner"
          onClick={() => {
            recoveryEvent('streak_recovery_started', recovery.date)
            changeSub('recoveryReview')
          }}
        >
          Верни серию <span aria-hidden="true">→</span>
        </button>
      )}

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
        (cardStates.morning !== 'done' || cardStates.review !== 'done') && (
          <p
            className="mx-today-pulse"
            style={{
              opacity: activeToday != null ? 1 : 0,
              transition: 'opacity 200ms ease',
            }}
          >
            {activeToday != null
              ? activeToday < 20
                ? `Сегодня в пути вместе с тобой: ${activeToday}`
                : `Сегодня свой путь продолжили ${activeToday.toLocaleString('ru-RU')} человек`
              : '\u00A0'}
          </p>
        )}

      {/* ======================================================
          МЫСЛЬ ДНЯ
          ====================================================== */}

      {!hiddenCards.includes('quote') && thoughtOfDay && (
        <button
          onClick={() => {
            platform.haptic('light')

            changeSub('dailyThought')
          }}
          data-testid="today-quote-card"
          className="mx-today-affirmation-card w-full px-[var(--mx-screen-x)] py-6 text-center animate-fade-in border-0 active:scale-[0.99] transition-transform"
        >
          <span className="block mx-type-meta text-muted mb-3">Мысль дня</span>

          <span className="block font-display mx-type-card text-cream">{thoughtOfDay.text}</span>
        </button>
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

      {!isEmpty && !hiddenCards.includes('dayProgress') && (
        <div className="mx-today-progress" role="status" data-testid="today-progress">
          <span className="mx-today-progress__label">Сегодня</span>
          <div className="mx-today-progress__track" aria-hidden="true">
            <div className="mx-today-progress__fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="mx-today-progress__count" data-testid="today-progress-count">
            {done} из {total}
          </span>
        </div>
      )}

      <PinnedPractices
        user={user}
        onOpenPractice={onOpenPractice}
        rituals={rituals}
        ascezas={ascezas}
        initialSheet={previewPinnedPracticesAction()}
      />

      {/* ======================================================
          ТЕМА НЕДЕЛИ — карточка-эталон Stoic (§5.1)
          ====================================================== */}

      {theme && !hiddenCards.includes('theme') && (
        <section className="mx-today-weekly-theme" data-testid="today-weekly-theme-section">
          <div className="mx-today-weekly-theme__header">
            <h2 className="mx-today-weekly-theme__heading">Тема недели</h2>
            <button
              type="button"
              className="mx-today-weekly-theme__all"
              data-testid="today-theme-all"
              aria-label="Все темы"
              onClick={() => {
                platform.haptic('light')
                changeSub('theme')
              }}
            >
              Все темы
              <ChevronRight
                size={16}
                className="mx-today-weekly-theme__chevron"
                aria-hidden="true"
              />
            </button>
          </div>
          <div
            className="mx-today-weekly-theme__card"
            data-testid="today-theme-card"
            role="button"
            tabIndex={0}
            aria-label={`${themeDayLabel}. ${theme.title}. ${themeQuestionText || ''}`}
            onClick={handleThemeCardTap}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleThemeCardTap()
              }
            }}
          >
            <span className="mx-today-weekly-theme__day">{themeDayLabel}</span>
            <span className="mx-today-weekly-theme__name">{theme.title}.</span>
            <span className="mx-today-weekly-theme__question">{themeQuestionText}</span>
            <button
              type="button"
              className="mx-today-weekly-theme__cta mx-today-day-card__start"
              data-testid="today-theme-write"
              onClick={e => {
                e.stopPropagation()
                handleThemeCardTap()
              }}
            >
              {themeCtaLabel}
            </button>
          </div>
        </section>
      )}

      {/*
        Кнопка «+» убрана с экрана: те же действия уже
        доступны из карточек Today и нижней навигации, а
        плавающая кнопка добавляла третий способ сделать
        то же самое. Компонент QuickAdd оставлен в коде.
      */}

      <GuestSaveReminder
        user={user}
        hasEntries={Boolean(checkin || checkinHistory.length || moodPractices.length)}
        onOpenSettings={onOpenSettings}
      />
    </div>
  )
}
