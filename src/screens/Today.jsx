import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
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
import History from './History'
import QuoteView from './QuoteView'
import MorningPilotCard from '../components/MorningPilotCard'
import SemanticGlyph from '../components/SemanticGlyph'
import EmptyState from '../components/EmptyState'
import TodayFocusCard from '../components/TodayFocusCard'
import TodayFocusFlow from './TodayFocusFlow'
import { readTodayFocusDay, clearTodayFocusPick } from '../lib/todayFocus'
import { useSynced } from '../lib/store'
import { getDailyThought } from '../data/dailyThoughts'
import { TODAY_CARDS_HIDDEN_KEY, parseHiddenCards } from '../lib/todayCardVisibility'
import {
  DayThread,
  DayThreadTrigger,
  FocusNextAction,
  NextActionReveal,
  TodayCompareControl,
} from '../components/TodayMotionExperiment'

const TODAY_COMPARE_REQUESTED =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('today_compare') === '1'

const INITIAL_TODAY_VARIANT =
  new URLSearchParams(window.location.search).get('today_variant') === 'before' ? 'before' : 'after'

// ── лента недели, как у stoic. ──

function WeekStrip() {
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  const now = new Date()
  const monday = new Date(now)

  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))

  const days = Array.from(
    {
      length: 7,
    },
    (_, index) => {
      const day = new Date(monday)

      day.setDate(monday.getDate() + index)

      return day
    }
  )

  return (
    <div className="flex justify-between w-full mb-4">
      {days.map(day => {
        const isToday = day.toDateString() === now.toDateString()

        return (
          <div
            key={day.getTime()}
            className={[
              'flex flex-col items-center gap-1 w-11 py-2 rounded-2xl text-[12px] font-semibold',
              isToday ? 'text-cream border border-cream/15' : 'text-faint',
            ].join(' ')}
          >
            {names[day.getDay()]}

            <b className="text-[16px] font-bold">{day.getDate()}</b>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// ONE NEXT ACTION
// ============================================================

function deriveNextAction({ rituals, ascezas }) {
  const undoneRituals = rituals.filter(ritual => !ritual.today_level)

  if (undoneRituals.length > 0) {
    return {
      kind: 'ritual',
      title: undoneRituals[0].name,
      meta: 'ритуал',
      sub: 'rituals',
    }
  }

  const unmarkedAscezas = ascezas.filter(asceza => !asceza.today_status)

  if (unmarkedAscezas.length > 0) {
    return {
      kind: 'asceza',
      title: unmarkedAscezas[0].name,
      meta: 'аскеза · отметься честно',
      sub: 'ascezas',
    }
  }

  return null
}

function formatRemainingActions(count) {
  if (count <= 0) {
    return 'Это последнее на сегодня'
  }

  const lastTwoDigits = count % 100
  const lastDigit = count % 10

  const noun =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? 'действий'
      : lastDigit === 1
        ? 'действие'
        : lastDigit >= 2 && lastDigit <= 4
          ? 'действия'
          : 'действий'

  return `После этого останется ещё ${count} ${noun}`
}

// ============================================================
// TODAY
// ============================================================

export default function Today({ user, onOpenPractice, onGoMentor, onFlowChange }) {
  const [initialTodaySnapshot] = useState(() => (user ? peekTodaySnapshot(user.id) : null))

  const [rituals, setRituals] = useState(() => initialTodaySnapshot?.rituals || [])

  const [ascezas, setAscezas] = useState(() => initialTodaySnapshot?.ascezas || [])

  const [loading, setLoading] = useState(() => !initialTodaySnapshot)

  const [dailyQuote, setDailyQuote] = useState(() => initialTodaySnapshot?.quote?.text || null)

  const [dailyThought] = useState(() => getDailyThought())

  const thoughtOfDay = useMemo(
    () => (dailyQuote ? { text: dailyQuote, attribution: 'твоя фраза' } : dailyThought),
    [dailyQuote, dailyThought]
  )

  const [checkin, setCheckin] = useState(() => initialTodaySnapshot?.checkin || null)

  const [reviewHour, setReviewHour] = useState(
    () => initialTodaySnapshot?.settings?.review_hour ?? 19
  )

  const [theme, setTheme] = useState(() => initialTodaySnapshot?.themes?.[0] || null)

  const [activeToday, setActiveToday] = useState(null)

  const [sub, setSub] = useState(null)

  const [todayFocus, setTodayFocus] = useState(null)

  const [focusFlowStep, setFocusFlowStep] = useState(null)

  const [pathTab, setPathTab] = useState('path')

  const [todayVariant, setTodayVariant] = useState(INITIAL_TODAY_VARIANT)

  const [dayThreadOpen, setDayThreadOpen] = useState(false)

  const [todayHeaderLeading, setTodayHeaderLeading] = useState(null)

  const [hiddenCardsRaw] = useSynced(TODAY_CARDS_HIDDEN_KEY, '[]')

  const hiddenCards = parseHiddenCards(hiddenCardsRaw)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTodayHeaderLeading(document.getElementById('mx-today-header-leading'))
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [sub])

  /*
   * Любой вложенный экран Today — это отдельный сценарий, а не
   * продолжение главной. Шапка с приветствием, переключателем
   * темы и аватаром там не нужна: человек уже внутри и знает,
   * где он. Возврат даёт системная кнопка Telegram.
   */
  function changeSub(nextSub) {
    onFlowChange?.(Boolean(nextSub))

    if (!nextSub) {
      setFocusFlowStep(null)
    }

    setSub(nextSub)
  }

  /*
   * По умолчанию флоу сам решает шаг (пустой список → input,
   * уже собранный → pick). Явный step нужен только для входа
   * из hero «Определить первый шаг» — сразу на firstStep, минуя
   * повторный выбор из уже известного picked.
   */
  function openTodayFocusFlow(step = null) {
    setFocusFlowStep(step)

    changeSub('todayFocus')
  }

  useEffect(() => {
    return () => {
      onFlowChange?.(false)
    }
  }, [onFlowChange])

  /*
   * todayFocus читается из localStorage при появлении user (Telegram-авторизация
   * резолвится асинхронно) — синхронизация с внешним пропом без побочных
   * эффектов, поэтому во время рендера, а не в useEffect.
   */
  const [seenFocusUserId, setSeenFocusUserId] = useState(null)
  if (user && seenFocusUserId !== user.id) {
    setSeenFocusUserId(user.id)
    setTodayFocus(readTodayFocusDay(user.id))
  }

  async function refreshCheckin() {
    if (!user) return

    try {
      const current = await api.checkin.today(user.id)

      setCheckin(current)

      invalidateTodayData(user.id)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!user || sub !== null) {
      return
    }

    let active = true

    ;(async () => {
      try {
        const {
          rituals: ritualsData,
          ascezas: ascezasData,
          quote: quoteData,
          checkin: checkinData,
          themes: themesData,
          settings: settingsData,
        } = await fetchTodayData(user.id, { force: Boolean(initialTodaySnapshot) })

        if (!active) return

        setTheme((themesData || [])[0] || null)

        api.pulse
          .today()
          .then(pulse => setActiveToday(pulse.active_today))
          .catch(() => {})

        setRituals(ritualsData)

        setAscezas(ascezasData)

        setDailyQuote(quoteData?.text || null)

        setCheckin(checkinData)

        setReviewHour(settingsData?.review_hour ?? 19)
      } catch (error) {
        console.error(error)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [user, sub, initialTodaySnapshot])

  const hourNow = new Date().getHours()

  const isReviewTime = hourNow >= reviewHour

  const todayState = checkin?.review_completed_at
    ? 'dayClosed'
    : isReviewTime
      ? 'reviewPending'
      : checkin
        ? 'dayInProgress'
        : 'checkinPending'

  // ============================================================
  // ЧЕК-ИН / АНАЛИЗ ДНЯ
  // ============================================================

  if (sub === 'checkin') {
    return (
      <CheckIn
        user={user}
        existing={checkin}
        mode={todayState === 'reviewPending' || todayState === 'dayClosed' ? 'evening' : 'checkin'}
        onDone={async () => {
          await refreshCheckin()

          changeSub(null)
        }}
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
  // РАЗГРУЗИТЬ ГОЛОВУ
  // ============================================================

  if (sub === 'todayFocus') {
    return (
      <TodayFocusFlow
        userId={user.id}
        initialItems={todayFocus?.items || []}
        initialStep={focusFlowStep || (todayFocus?.items?.length ? 'pick' : 'input')}
        initialPicked={todayFocus?.picked || null}
        onClose={() => changeSub(null)}
        onPicked={entry => {
          setTodayFocus(entry)
        }}
      />
    )
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
        <div className="w-full max-w-md px-5 pt-4 pb-3 flex items-center gap-3">
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
                  'flex-1 py-2 rounded-full text-[12px] font-bold border-0 transition-colors',
                  pathTab === key ? 'bg-cream/10 text-cream' : 'bg-transparent text-muted',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md px-5">
          <YearPath user={user} onContinueToday={() => changeSub(null)} />
        </div>

        {pathTab === 'path' ? (
          <Path user={user} />
        ) : (
          <div className="w-full max-w-md px-5">
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

  // ============================================================
  // ДАННЫЕ ДНЯ
  // ============================================================

  const total = rituals.length + ascezas.length

  const done =
    rituals.filter(ritual => ritual.today_level).length +
    ascezas.filter(asceza => asceza.today_status).length

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const next = deriveNextAction({
    rituals,
    ascezas,
  })

  const isEmpty = total === 0

  const checkinDone = !!checkin

  const checkinAsHero = todayState === 'checkinPending' || todayState === 'reviewPending'

  /*
   * ГЕРОЙ-ИЛЛЮСТРАЦИЯ ПО СОСТОЯНИЮ ДНЯ
   *
   * Раньше картинка выбиралась по признаку
   * «есть ли вообще ритуалы и аскезы»: пусто —
   * нить, не пусто — лабиринт. Отсюда и разные
   * картинки на разных аккаунтах: дело было не
   * в состоянии дня, а в наполненности профиля.
   *
   * Теперь это один рисунок с состоянием, а не
   * три разные картинки. Раньше за день человек
   * видел нить, потом лабиринт, потом дверь — и
   * ни один образ не отвечал на вопрос «где я
   * сейчас». «Дуга дня» отвечает: свет выходит
   * на горизонт утром, поднимается ровно на
   * долю сделанного и садится к ночи.
   *
   * Лабиринт остался там, где он логотип, — в
   * шапке, в нижнем меню и на первом экране
   * знакомства.
   */
  const heroArt = (
    <div className="w-full rounded-[28px] bg-artbed overflow-hidden mb-5 py-2">
      <DayArc
        state={todayState}
        done={done}
        total={total}
        className="w-full max-w-[300px] h-[150px] mx-auto text-gold"
      />
    </div>
  )

  const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']

  const remainRituals = rituals.filter(ritual => !ritual.today_level).length

  const remainAscezas = ascezas.filter(asceza => !asceza.today_status).length

  const remainAfter = Math.max(0, remainRituals + remainAscezas - 1)

  const remainingActionsText = formatRemainingActions(remainAfter)

  const motionExperimentEnabled = !TODAY_COMPARE_REQUESTED || todayVariant === 'after'

  /*
   * Merge «Точки внимания» в hero (Цикл 0B) — только
   * production-вариант (после), только пока день идёт, и
   * только если фокус реально выбран. В dev-only сравнении
   * «до» и в остальных состояниях дня (чек-ин, разбор,
   * закрытый день) поведение не трогаем.
   */
  const showFocusHero =
    motionExperimentEnabled && todayState === 'dayInProgress' && Boolean(todayFocus?.picked)

  /*
   * MXL-UX-U07: hero contract — явная state → presentation мапа.
   *
   * checkinAsHero (todayState checkinPending/reviewPending) — одна общая
   * форма, параметризованная текстом по todayState, вынесена отдельно от
   * мапы: она уже однозначно определяется одним условием, не цепочкой.
   *
   * Для остального дня (todayState === 'dayInProgress' или 'dayClosed')
   * heroPresentationState — единственное значение, которое решает, что
   * показать; heroContentByState — таблица «состояние → готовый JSX»,
   * а не последовательность независимо повторяющихся условий, как было
   * раньше. motionExperimentEnabled сюда намеренно не входит — это
   * временный экспериментальный слой поверх итогового состояния 'next',
   * не часть самого контракта.
   */
  const heroPresentationState =
    todayState === 'dayClosed'
      ? 'dayClosed'
      : showFocusHero
        ? 'focus'
        : isEmpty
          ? 'empty'
          : next
            ? 'next'
            : 'allDone'

  const heroCheckinContent = (
    <>
      <div className="mx-type-meta text-muted mb-2">
        {todayState === 'reviewPending' ? 'Анализ дня' : 'Идея дня'}
      </div>

      <h2 className="font-display mx-type-hero text-cream">
        {todayState === 'reviewPending' ? 'Разобрать день?' : 'Как ты?'}
      </h2>

      <p className="mx-type-body text-muted mt-2">
        {todayState === 'reviewPending'
          ? 'Уроки и то, чем стоит гордиться'
          : 'Короткая утренняя настройка'}
      </p>

      {todayState === 'reviewPending' && (
        <div className="w-full max-w-sm mx-auto mt-5 space-y-2 text-left">
          {['Что получилось?', 'Что было трудно?', 'Какой вывод забираешь?'].map(question => (
            <div
              key={question}
              className="rounded-2xl bg-cream/5 px-4 py-2.5 text-[12px] text-muted"
            >
              {question}
            </div>
          ))}

          <div className="text-[11px] text-gold font-semibold px-1 pt-1">
            + три вещи, которыми гордишься
          </div>
        </div>
      )}

      <button
        onClick={() => {
          platform.haptic('medium')

          changeSub('checkin')
        }}
        className="cta-pill mx-type-control px-11 py-4 mx-auto mt-7"
      >
        {todayState === 'reviewPending' ? 'Разобрать день' : 'Пройти чек-ин'}
      </button>

      {next && <p className="mx-type-meta text-faint mt-5">Следующее действие: {next.title}</p>}
    </>
  )

  const heroContentByState = {
    dayClosed: (
      <>
        <div className="mx-type-meta text-muted mb-2">Сегодня</div>

        <h2 className="font-display mx-type-hero text-cream">День закрыт</h2>

        <p className="mx-type-body text-muted mt-2">Вечерний разбор завершён</p>

        <button
          onClick={() => {
            platform.haptic('medium')

            changeSub('checkin')
          }}
          className="cta-pill mx-type-control px-9 py-4 mx-auto mt-7"
        >
          Открыть разбор снова
        </button>
      </>
    ),

    focus: (
      <FocusNextAction
        focus={todayFocus}
        onDefineFirstStep={() => {
          platform.haptic('medium')

          openTodayFocusFlow('firstStep')
        }}
        onChangeFocus={() => {
          platform.haptic('light')

          openTodayFocusFlow()
        }}
        onClearFocus={() => {
          platform.haptic('light')

          const entry = clearTodayFocusPick(user.id)

          setTodayFocus(entry)
        }}
      />
    ),

    empty: (
      <>
        <div className="mx-type-meta text-muted mb-2">Твой путь ждёт</div>

        <h2 className="font-display mx-type-hero text-cream">Добавь первый ритуал</h2>

        <p className="mx-type-body text-muted mt-2">
          Система работает через регулярность — начни с одного
        </p>

        <button
          onClick={() => {
            platform.haptic('medium')

            onOpenPractice('rituals')
          }}
          className="cta-pill mx-type-control px-11 py-4 mx-auto mt-7"
        >
          Начать
        </button>
      </>
    ),

    next:
      next &&
      (motionExperimentEnabled ? (
        <NextActionReveal
          next={next}
          remainingActionsText={remainingActionsText}
          onStart={() => {
            platform.haptic('medium')

            onOpenPractice(next.sub)
          }}
        />
      ) : (
        <>
          <div className="mx-type-meta text-muted mb-2">Действие дня</div>

          <h2 className="font-display mx-type-hero text-cream">{next.title}</h2>

          <p className="mx-type-body text-muted mt-2">{next.meta}</p>

          <button
            onClick={() => {
              platform.haptic('medium')

              onOpenPractice(next.sub)
            }}
            className="cta-pill mx-type-control px-11 py-4 mx-auto mt-7"
          >
            Начать
          </button>

          <p className="mx-type-meta text-faint mt-5">{remainingActionsText}</p>
        </>
      )),

    allDone: (
      <>
        <div className="mx-type-meta text-muted mb-2">Новый шаг</div>

        <h2 className="font-display mx-type-hero text-cream">
          Сегодня ты выше, чем вчера
        </h2>

        <p className="mx-type-body text-muted mt-2">Все практики закрыты</p>

        <button
          onClick={() => {
            platform.haptic('medium')

            onGoMentor()
          }}
          className="cta-pill mx-type-control px-9 py-4 mx-auto mt-7"
        >
          Поговорить с наставником
        </button>
      </>
    ),
  }

  function changeTodayVariant(nextVariant) {
    setTodayVariant(nextVariant)

    if (nextVariant === 'before') {
      setDayThreadOpen(false)
    }

    const url = new URL(window.location.href)

    url.searchParams.set('today_variant', nextVariant)

    window.history.replaceState(null, '', url)
  }

  return (
    <div className="w-full max-w-md px-5">
      {motionExperimentEnabled &&
        todayHeaderLeading &&
        createPortal(
          <DayThreadTrigger
            open={dayThreadOpen}
            onToggle={() => setDayThreadOpen(value => !value)}
          />,
          todayHeaderLeading
        )}

      <WeekStrip />

      {TODAY_COMPARE_REQUESTED && (
        <TodayCompareControl mode={todayVariant} onChange={changeTodayVariant} />
      )}

      {motionExperimentEnabled && dayThreadOpen && (
        <DayThread
          checkinDone={checkinDone}
          done={done}
          open={dayThreadOpen}
          onOpenChange={setDayThreadOpen}
          total={total}
          todayState={todayState}
        />
      )}

      {/* ======================================================
          ГЕРОЙ-КАРТОЧКА
          ====================================================== */}

      {/*
        Плоская поверхность карточки, а не градиент.
        Градиента нет в таблице токенов, и именно из-за
        него подложка под иллюстрацией читалась как
        отдельная плашка: она плоская, карточка была с
        переходом. На одном цвете подложка сливается с
        карточкой и остаётся тем, чем задумана, — окном
        в ночь, тёмным в обеих темах.
      */}
      <div className="rounded-[28px] bg-emerald px-6 pt-5 pb-6 mt-6 text-center flex flex-col justify-center animate-fade-in">
        {motionExperimentEnabled ? (
          <div className="mx-today-hero-art" aria-label="Один следующий шаг">
            <SemanticGlyph
              kind="next-step"
              debugSource="Today.jsx"
              className="mx-today-hero-art-glyph"
            />
            <span>один следующий шаг</span>
          </div>
        ) : (
          heroArt
        )}

        {checkinAsHero ? heroCheckinContent : heroContentByState[heroPresentationState]}
      </div>

      {!showFocusHero && !hiddenCards.includes('focus') && (
        <TodayFocusCard
          focus={todayFocus}
          readOnly={todayState === 'dayClosed'}
          onOpenFlow={() => openTodayFocusFlow()}
          onClearFocus={() => {
            const entry = clearTodayFocusPick(user.id)

            setTodayFocus(entry)
          }}
        />
      )}

      <MorningPilotCard
        userId={user.id}
        rituals={rituals}
        onOpenRituals={() => onOpenPractice('rituals')}
        todayFocusPicked={Boolean(todayFocus?.picked)}
      />

      {/* ======================================================
          ПУЛЬС
          ====================================================== */}

      {activeToday !== null && activeToday > 1 && !hiddenCards.includes('pulse') && (
        <p className="text-center mx-type-meta text-faint mt-4">
          {activeToday < 20
            ? `Сегодня в пути вместе с тобой: ${activeToday}`
            : `Сегодня свой путь продолжили ${activeToday.toLocaleString('ru-RU')} человек`}
        </p>
      )}

      {/* ======================================================
          УТРЕННИЙ ЧЕК-ИН
          ====================================================== */}

      {checkinDone && (
        <button
          onClick={() => {
            platform.haptic('light')

            changeSub('checkin')
          }}
          className="w-full rounded-3xl bg-emerald/60 px-5 py-3 mt-5 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
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
              настроение: {MOOD_WORDS[(checkin.mood || 3) - 1]}
            </span>
          </span>

          <span className="mx-type-meta text-faint shrink-0">изменить</span>
        </button>
      )}

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

      {!hiddenCards.includes('dayProgress') &&
        (isEmpty ? (
          <EmptyState className="mt-8">
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
          </EmptyState>
        ) : (
          <button
            onClick={() => {
              platform.haptic('light')

              setPathTab('history')

              changeSub('path')
            }}
            className="w-full rounded-3xl bg-emerald px-5 py-4 mt-8 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
          >
            <ArrowUpRight size={18} className="text-gold shrink-0" strokeWidth={2} />

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

            <ChevronRight size={18} className="text-faint shrink-0" />
          </button>
        ))}

      {/* ======================================================
          ТЕМА НЕДЕЛИ
          ====================================================== */}

      {theme && !hiddenCards.includes('theme') && (
        <button
          onClick={() => {
            platform.haptic('light')

            changeSub('theme')
          }}
          className="mx-today-theme-card w-full px-5 py-5 mt-4 text-center active:scale-[0.99] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] animate-fade-in"
        >
          <span className="block mx-type-meta text-faint uppercase tracking-wider mb-2">
            Тема недели
          </span>

          <span className="block font-display mx-type-card text-cream lowercase">
            {theme.title}
          </span>

          <span className="block mx-type-list-body text-muted mt-2">{theme.subtitle}</span>

          <span className="flex items-center justify-center gap-1.5 mt-4">
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

          <span className="block mx-type-meta text-faint mt-3">
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
          className="w-full px-2 py-5 mt-4 text-center animate-fade-in border-0 active:scale-[0.99] transition-transform"
        >
          <span className="block mx-type-meta text-muted mb-3">Мысль дня</span>

          <span className="block font-display mx-type-card text-cream">
            {thoughtOfDay.text}
          </span>

          <span className="block mx-type-meta text-faint mt-4">
            {thoughtOfDay.attribution} · открыть →
          </span>
        </button>
      )}
    </div>
  )
}
