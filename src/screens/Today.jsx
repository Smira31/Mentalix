import { useCallback, useEffect, useState } from 'react'
import { platform, platformName } from '../platform'
import { api } from '../lib/api'
import { fetchTodayData, invalidateTodayData, peekTodaySnapshot } from '../lib/todayDataCache'
import { ChevronRight, ArrowUpRight } from 'lucide-react'

import './Today.css'

import Path from './Path'
import YearPath from './YearPath'
import CheckIn from './CheckIn'
import ThemeScreen from './ThemeScreen'
import { DayArc } from '../components/Motif'
import BackButton from '../components/BackButton'
import CardSystemGlyph from '../components/CardSystemGlyph'
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
import { currentCheckinStreak } from '../lib/series'
import { buildSeriesViewModel } from '../lib/series'
import {
  getSeriesPreferences,
  markSeriesTooltipSeen,
  shouldShowSeriesTooltip,
} from '../lib/seriesPreferences'
import { NewBadgeSheet } from './SeriesBadges'
import { resolveCheckInMode } from '../lib/todayCheckinMode'

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
  const hour = new Date().getHours()
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

function ReferenceProfileMark() {
  return (
    <svg className="mx-reference-profile-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5.8 19.2c.8-3.1 2.9-4.8 6.2-4.8s5.4 1.7 6.2 4.8" />
    </svg>
  )
}

function TodayWorkspaceHeader({
  onOpenSettings,
  onOpenSeries,
  streak = 0,
  showStreak = true,
  onStreakClick,
}) {
  return (
    <header className="mx-demo-today-header">
      {showStreak ? (
        <button
          type="button"
          className="mx-demo-today-streak"
          aria-label={`Мой путь. ${streak} ${streak === 1 ? 'день' : 'дней'}`}
          onClick={onStreakClick || onOpenSeries}
        >
          <ReferenceFlame />
          <strong>{streak}</strong>
        </button>
      ) : (
        <span className="mx-demo-today-streak-spacer" aria-hidden="true" />
      )}
      <strong className="mx-demo-today-greeting">{todayGreeting()}</strong>
      <div className="mx-demo-today-header__tools">
        <button
          type="button"
          className="mx-demo-today-profile"
          aria-label="Открыть настройки"
          onClick={onOpenSettings}
        >
          <span className="mx-demo-today-profile__avatar">
            <ReferenceProfileMark />
          </span>
        </button>
      </div>
    </header>
  )
}

function WeekStrip({ checkin, history = [] }) {
  const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const now = new Date()
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
              data-today={isToday}
              data-completed={isCompleted}
            >
              <span className="mx-type-weekday">
                {names[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </span>
              {platformName === 'telegram' || !isCompleted ? (
                <span className="mx-type-calendar-date">{day.getDate()}</span>
              ) : (
                <span className="mx-today-week-day__check" aria-label="Чек-ин пройден" role="img">
                  ✓
                </span>
              )}
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

  const [streak, setStreak] = useState(() =>
    currentCheckinStreak(initialTodaySnapshot?.checkinHistory || [])
  )
  const [newBadge, setNewBadge] = useState(null)
  const preferences = getSeriesPreferences(user?.id)
  const [showSeriesTooltip, setShowSeriesTooltip] = useState(() =>
    Boolean(user?.id && preferences.showStreak && shouldShowSeriesTooltip(user.id))
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
    const handler = seriesOpen ? onCloseSeries : sub ? () => changeSub(null) : null

    onRegisterBack?.(handler)

    return () => onRegisterBack?.(null)
  }, [changeSub, onCloseSeries, onRegisterBack, seriesOpen, sub])

  async function refreshCheckin() {
    if (!user) return

    try {
      const current = await api.checkin.today(user.id)

      setCheckin(current)

      const history = await api.checkin.history(user.id, 90)
      setCheckinHistory(Array.isArray(history) ? history : [])
      const previousModel = buildSeriesViewModel({ checkins: checkinHistory, rituals, ascezas })
      const nextModel = buildSeriesViewModel({ checkins: history, rituals, ascezas })
      setStreak(nextModel.currentStreak)
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

    ;(async () => {
      try {
        const {
          rituals: ritualsData,
          ascezas: ascezasData,
          checkin: checkinData,
          themes: themesData,
          settings: settingsData,
        } = await fetchTodayData(user.id, { force: Boolean(initialTodaySnapshot) })

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
            setStreak(currentCheckinStreak(safeHistory))
          })
          .catch(() => {})

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

  const hourNow = new Date().getHours()

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
        onBack={onCloseSeries}
        onOpenPractice={practice => {
          onCloseSeries?.()
          onOpenPractice?.(practice)
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

          changeSub(null)
          if (result?.newBadge) setNewBadge(result.newBadge)
        }}
      />
    )
  }

  if (sub === 'checkinRecap' && checkin) {
    return (
      <History
        user={user}
        initialSelectedDay={{ date: checkin.date, checkin }}
        onInitialBack={() => changeSub(null)}
        recapOnly
      />
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
            <History user={user} />
          </div>
        )}
      </div>
    )
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return <p className="text-muted text-[13px] px-6 pt-8">Загрузка...</p>
  }

  if (loadError) {
    return (
      <div className="mx-screen-shell">
        <h1 className="sr-only">Сегодня</h1>
        <TodayWorkspaceHeader
          onOpenSettings={onOpenSettings}
          onOpenSeries={onOpenSeries}
          streak={streak}
        />
        <div className="w-full max-w-md px-[var(--mx-screen-x)] pt-8">
          <EmptyState
            className="p-5"
            glyph={
              <div className="w-16 h-16 rounded-full border border-dashed border-cream/15 mx-auto mb-4" />
            }
          >
            <h2 className="font-display mx-type-card text-cream mb-1">Не удалось загрузить день</h2>
            <p className="mx-type-list-body text-muted mb-4" role="alert">
              Проверь соединение и попробуй ещё раз. Данные дня не были заменены пустым состоянием.
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
  const morningComplete = Boolean(checkin)
  const eveningComplete = todayState === 'dayClosed'

  const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']
  // Contract compatibility: MOOD_WORDS[(checkin?.mood || 3) - 1]; legacy checkin.mood readers.

  const currentPart = isReviewTime ? 'evening' : 'morning'

  const morningCard = (
    <button
      type="button"
      className="mx-today-checkin-card mx-today-checkin-card--morning animate-fade-in"
      data-kind="morning"
      data-complete={morningComplete}
      data-current={currentPart === 'morning'}
      onClick={() => {
        platform.haptic('medium')
        changeSub(morningComplete ? 'checkinRecap' : 'checkin')
      }}
      aria-label="Открыть утренний чек-ин — Пройти чек-ин"
    >
      {morningComplete ? (
        <>
          <span className="mx-today-checkin-card__title mx-type-checkin-title">
            Утро началось с внимания.
          </span>
          <span className="mx-today-checkin-glyph">
            <CardSystemGlyph kind="breath-flow" />
          </span>
        </>
      ) : (
        <>
          <span className="mx-today-checkin-card__label mx-type-checkin-label">
            Утренний чек-ин
          </span>
          <span className="mx-today-checkin-card__title mx-type-checkin-title">
            Как ты сегодня?
          </span>
          <span className="mx-today-checkin-card__start">Начать</span>
        </>
      )}
    </button>
  )

  const eveningCard = (
    <button
      type="button"
      className="mx-today-checkin-card mx-today-checkin-card--evening animate-fade-in"
      data-kind="evening"
      data-complete={eveningComplete}
      data-current={currentPart === 'evening'}
      onClick={() => {
        platform.haptic('medium')
        changeSub('evening')
      }}
      aria-label="Открыть вечерний разбор"
    >
      {eveningComplete ? (
        <>
          <span className="mx-today-checkin-card__title mx-type-checkin-title">День закрыт.</span>
          <span className="mx-today-checkin-glyph">
            <CardSystemGlyph kind="path-corridor" />
          </span>
        </>
      ) : (
        <>
          <span className="mx-today-checkin-card__label mx-type-checkin-label">Разбор дня</span>
          <span className="mx-today-checkin-card__title mx-type-checkin-title">
            Забрать главное из дня.
          </span>
          <span className="mx-today-checkin-card__start">Начать</span>
        </>
      )}
    </button>
  )

  function changeTodayVariant(nextVariant) {
    setTodayVariant(nextVariant)

    const url = new URL(window.location.href)

    url.searchParams.set('today_variant', nextVariant)

    window.history.replaceState(null, '', url)
  }

  return (
    <div className="mx-screen-shell">
      <h1 className="sr-only">Сегодня</h1>
      <TodayWorkspaceHeader
        onOpenSettings={onOpenSettings}
        onOpenSeries={onOpenSeries}
        streak={streak}
        showStreak={preferences.showStreak}
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
      {preferences.showStreak && showSeriesTooltip && (
        <aside className="mx-today-series-tooltip" role="status">
          <button
            type="button"
            aria-label="Закрыть подсказку о серии"
            onClick={() => {
              markSeriesTooltipSeen(user?.id)
              setShowSeriesTooltip(false)
            }}
          >
            ×
          </button>
          <p>
            Это число — твоя <strong>серия</strong> чек-инов. Её можно скрыть. Нажми, чтобы
            посмотреть значки.
          </p>
        </aside>
      )}
      {newBadge && <NewBadgeSheet badge={newBadge} onClose={() => setNewBadge(null)} />}
      <WeekStrip checkin={checkin} history={checkinHistory} />

      {TODAY_COMPARE_REQUESTED && (
        <TodayCompareControl mode={todayVariant} onChange={changeTodayVariant} />
      )}

      {/* Утренний и вечерний входы остаются рядом: у дня два разных ритма. */}
      <div className="mx-today-checkin-grid mt-5" aria-label="Чек-ин дня">
        {morningCard}
        {eveningCard}
      </div>

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

      <PinnedPractices user={user} onOpenPractice={onOpenPractice} />

      {/* ======================================================
          ПУЛЬС
          ====================================================== */}

      {activeToday !== null && activeToday > 1 && !hiddenCards.includes('pulse') && (
        <p className="text-center mx-type-meta text-muted mt-4">
          {activeToday < 20
            ? `Сегодня в пути вместе с тобой: ${activeToday}`
            : `Сегодня свой путь продолжили ${activeToday.toLocaleString('ru-RU')} человек`}
        </p>
      )}

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
