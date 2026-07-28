import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

import Path from './Path'
import CheckIn from './CheckIn'
import MazeLogo from '../components/MazeLogo'
import QuickAdd from '../components/QuickAdd'
import ThemeScreen from './ThemeScreen'
import { ArtThread } from '../components/Art'
import History from './History'
import QuoteView from './QuoteView'


// ============================================================
// ВРЕМЕННО ДЛЯ ТЕСТА
// После проверки вечернего сценария поменяем на false.
// ============================================================

const FORCE_EVENING_REVIEW = true


// ── лента недели, как у stoic. ──

function WeekStrip() {
  const names = [
    'Вс',
    'Пн',
    'Вт',
    'Ср',
    'Чт',
    'Пт',
    'Сб',
  ]

  const now = new Date()
  const monday = new Date(now)

  monday.setDate(
    now.getDate()
      - (
        (now.getDay() + 6)
        % 7
      )
  )

  const days =
    Array.from(
      {
        length: 7,
      },
      (_, index) => {
        const day =
          new Date(monday)

        day.setDate(
          monday.getDate()
            + index
        )

        return day
      },
    )


  return (
    <div className="flex justify-between w-full mb-4">
      {days.map((day) => {
        const isToday =
          day.toDateString()
          === now.toDateString()

        return (
          <div
            key={
              day.getTime()
            }
            className={[
              'flex flex-col items-center gap-1 w-11 py-2 rounded-2xl text-[12px] font-semibold',
              isToday
                ? 'text-cream border border-cream/15'
                : 'text-cream/35',
            ].join(' ')}
          >
            {names[
              day.getDay()
            ]}

            <b className="text-[16px] font-bold">
              {day.getDate()}
            </b>
          </div>
        )
      })}
    </div>
  )
}


// ============================================================
// ONE NEXT ACTION
// ============================================================

function deriveNextAction({
  rituals,
  ascezas,
}) {
  const undoneRituals =
    rituals.filter(
      (ritual) =>
        !ritual.today_level,
    )

  if (
    undoneRituals.length > 0
  ) {
    return {
      kind: 'ritual',
      title:
        undoneRituals[0].name,
      meta: 'ритуал',
      sub: 'rituals',
    }
  }


  const unmarkedAscezas =
    ascezas.filter(
      (asceza) =>
        !asceza.today_status,
    )

  if (
    unmarkedAscezas.length > 0
  ) {
    return {
      kind: 'asceza',
      title:
        unmarkedAscezas[0].name,
      meta:
        'аскеза · отметься честно',
      sub: 'ascezas',
    }
  }


  return null
}


// ============================================================
// TODAY
// ============================================================

export default function Today({
  user,
  onOpenPractice,
  onGoMentor,
}) {
  const [rituals, setRituals] =
    useState([])

  const [ascezas, setAscezas] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [
    dailyQuote,
    setDailyQuote,
  ] = useState(null)

  const [checkin, setCheckin] =
    useState(null)

  const [
    reviewHour,
    setReviewHour,
  ] = useState(19)

  const [theme, setTheme] =
    useState(null)

  const [
    activeToday,
    setActiveToday,
  ] = useState(null)

  const [sub, setSub] =
    useState(null)

  const [pathTab, setPathTab] =
    useState('path')


  async function refreshCheckin() {
    if (!user) return

    try {
      const current =
        await api.checkin
          .today(user.id)

      setCheckin(current)
    } catch (error) {
      console.error(error)
    }
  }


  useEffect(() => {
    if (
      !user
      || sub !== null
    ) {
      return
    }

    ;(async () => {
      try {
        const [
          ritualsData,
          ascezasData,
          quoteData,
          checkinData,
          themesData,
          settingsData,
        ] =
          await Promise.all([
            api.rituals.list(
              user.id,
            ),

            api.ascezas.list(
              user.id,
            ),

            api.quotes.today(
              user.id,
            ),

            api.checkin
              .today(user.id)
              .catch(
                () => null,
              ),

            api.themes
              .list(user.id)
              .catch(
                () => [],
              ),

            api.profile
              .getSettings(
                user.id,
              )
              .catch(
                () => null,
              ),
          ])


        setTheme(
          (
            themesData
            || []
          )[0]
          || null,
        )


        api.pulse
          .today()
          .then(
            (pulse) =>
              setActiveToday(
                pulse.active_today,
              ),
          )
          .catch(
            () => {},
          )


        setRituals(
          ritualsData,
        )

        setAscezas(
          ascezasData,
        )

        setDailyQuote(
          quoteData?.text
          || null,
        )

        setCheckin(
          checkinData,
        )

        setReviewHour(
          settingsData
            ?.review_hour
          ?? 19,
        )
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    })()
  }, [
    user,
    sub,
  ])


  const hourNow =
    new Date()
      .getHours()


  const isReviewTime =
    FORCE_EVENING_REVIEW
    || hourNow
      >= reviewHour


  // ============================================================
  // ЧЕК-ИН / АНАЛИЗ ДНЯ
  // ============================================================

  if (
    sub === 'checkin'
  ) {
    return (
      <CheckIn
        user={user}
        existing={checkin}
        mode={
          isReviewTime
            ? 'evening'
            : 'auto'
        }
        onDone={async () => {
          await refreshCheckin()

          setSub(null)
        }}
      />
    )
  }


  // ============================================================
  // ТЕМА НЕДЕЛИ
  // ============================================================

  if (
    sub === 'theme'
    && theme
  ) {
    return (
      <ThemeScreen
        user={user}
        themeId={theme.id}
        onBack={() =>
          setSub(null)
        }
      />
    )
  }


  // ============================================================
  // ЦИТАТЫ
  // ============================================================

  if (
    sub === 'quote'
  ) {
    return (
      <QuoteView
        user={user}
        todayQuote={
          dailyQuote
        }
        onClose={() =>
          setSub(null)
        }
      />
    )
  }


  // ============================================================
  // ПУТЬ / ИСТОРИЯ
  // ============================================================

  if (
    sub === 'path'
  ) {
    return (
      <div className="w-full flex flex-col items-center animate-fade-in">
        <div className="w-full max-w-md px-5 pb-3 flex items-center gap-3">
          <button
            onClick={() => {
              platform.haptic(
                'light',
              )

              setSub(null)
            }}
            aria-label="Назад"
            className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
          >
            <ChevronLeft
              size={20}
              className="text-cream/60"
            />
          </button>


          <div className="flex-1 flex bg-emerald rounded-full p-1">
            {[
              [
                'path',
                'Путь',
              ],
              [
                'history',
                'История',
              ],
            ].map(
              ([
                key,
                label,
              ]) => (
                <button
                  key={key}
                  onClick={() => {
                    platform.haptic(
                      'light',
                    )

                    setPathTab(
                      key,
                    )
                  }}
                  className={[
                    'flex-1 py-2 rounded-full text-[13px] font-bold border-0 transition-colors',
                    pathTab
                      === key
                      ? 'bg-cream/10 text-cream'
                      : 'bg-transparent text-cream/40',
                  ].join(
                    ' ',
                  )}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>


        {pathTab
          === 'path' ? (
          <Path
            user={user}
          />
        ) : (
          <div className="w-full max-w-md px-5 pb-40">
            <History
              user={user}
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
    return (
      <p className="text-cream/40 text-sm px-6 pt-8">
        Загрузка...
      </p>
    )
  }


  // ============================================================
  // ДАННЫЕ ДНЯ
  // ============================================================

  const total =
    rituals.length
    + ascezas.length


  const done =
    rituals.filter(
      (ritual) =>
        ritual.today_level,
    ).length
    +
    ascezas.filter(
      (asceza) =>
        asceza.today_status,
    ).length


  const pct =
    total > 0
      ? Math.round(
          (
            done / total
          ) * 100,
        )
      : 0


  const next =
    deriveNextAction({
      rituals,
      ascezas,
    })


  const isEmpty =
    total === 0


  const checkinDone =
    !!checkin


  const eveningReviewDone =
    !!(
      checkin?.lessons
      || (
        Array.isArray(
          checkin?.wins,
        )
        && checkin.wins.length
          > 0
      )
    )


  // Важное исправление:
  // утренний чек-ин больше НЕ блокирует вечерний разбор.
  //
  // После наступления reviewHour показываем анализ дня,
  // пока пользователь реально не сохранил lessons или wins.

  const checkinAsHero =
    (
      isReviewTime
      && !eveningReviewDone
    )
    ||
    (
      !checkinDone
      && isEmpty
      && hourNow >= 12
    )


  const MOOD_WORDS = [
    'тяжко',
    'так себе',
    'нормально',
    'хорошо',
    'отлично',
  ]


  const remainRituals =
    rituals.filter(
      (ritual) =>
        !ritual.today_level,
    ).length


  const remainAscezas =
    ascezas.filter(
      (asceza) =>
        !asceza.today_status,
    ).length


  const remainAfter =
    Math.max(
      0,
      remainRituals
      + remainAscezas
      - 1,
    )


  return (
    <div className="w-full max-w-md px-5 pb-40">
      <WeekStrip />


      {/* ======================================================
          ГЕРОЙ-КАРТОЧКА
          ====================================================== */}

      <div className="rounded-[32px] bg-gradient-to-b from-emerald to-emerald-light/60 px-6 py-10 text-center flex flex-col justify-center min-h-[54vh] animate-fade-in">
        {isEmpty ? (
          <ArtThread
            size={150}
            className="mx-auto mb-7"
          />
        ) : (
          <MazeLogo
            size={168}
            progress={
              total > 0
                ? done / total
                : 0
            }
            className="mx-auto mb-7"
          />
        )}


        {checkinAsHero && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">
              Анализ дня
            </div>


            <h2 className="font-display text-[28px] text-cream leading-tight">
              Разобрать день?
            </h2>


            <p className="text-[14px] text-cream/50 mt-2">
              Уроки и то, чем стоит гордиться
            </p>


            <button
              onClick={() => {
                platform.haptic(
                  'medium',
                )

                setSub(
                  'checkin',
                )
              }}
              className="cta-pill text-[16px] px-11 py-4 mx-auto mt-7"
            >
              Начать
            </button>


            {next && (
              <p className="text-[12px] text-cream/35 mt-5">
                Дальше:{' '}
                {next.title}
              </p>
            )}
          </>
        )}


        {!checkinAsHero
          && isEmpty && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">
              Твой путь ждёт
            </div>


            <h2 className="font-display text-[26px] text-cream leading-tight">
              Добавь первый ритуал
            </h2>


            <p className="text-[14px] text-cream/50 mt-2">
              Система работает через регулярность — начни с одного
            </p>


            <button
              onClick={() => {
                platform.haptic(
                  'medium',
                )

                onOpenPractice(
                  'rituals',
                )
              }}
              className="cta-pill text-[16px] px-11 py-4 mx-auto mt-7"
            >
              Начать
            </button>
          </>
        )}


        {!checkinAsHero
          && !isEmpty
          && next && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">
              Самое важное
            </div>


            <h2 className="font-display text-[28px] text-cream leading-tight">
              {next.title}
            </h2>


            <p className="text-[14px] text-cream/50 mt-2">
              {next.meta}
            </p>


            <button
              onClick={() => {
                platform.haptic(
                  'medium',
                )

                onOpenPractice(
                  next.sub,
                )
              }}
              className="cta-pill text-[16px] px-11 py-4 mx-auto mt-7"
            >
              Начать
            </button>


            <p className="text-[12px] text-cream/35 mt-5">
              {remainAfter > 0
                ? `После этого останется: ${remainAfter}`
                : 'Это последнее на сегодня'}
            </p>
          </>
        )}


        {!checkinAsHero
          && !isEmpty
          && !next && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">
              Путь продолжается
            </div>


            <h2 className="font-display text-[26px] text-cream leading-tight">
              Сегодня ты выше, чем вчера
            </h2>


            <p className="text-[14px] text-cream/50 mt-2">
              Все практики закрыты
            </p>


            <button
              onClick={() => {
                platform.haptic(
                  'medium',
                )

                onGoMentor()
              }}
              className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
            >
              Поговорить с наставником
            </button>
          </>
        )}
      </div>


      {/* ======================================================
          ПУЛЬС
          ====================================================== */}

      {activeToday !== null
        && activeToday > 1 && (
          <p className="text-center text-[12px] text-cream/30 font-semibold mt-4">
            {activeToday < 20
              ? `Сегодня в пути вместе с тобой: ${activeToday}`
              : `Сегодня свой путь продолжили ${activeToday.toLocaleString(
                  'ru-RU',
                )} человек`}
          </p>
        )}


      {/* ======================================================
          УТРЕННИЙ ЧЕК-ИН
          ====================================================== */}

      {!checkinAsHero
        && !checkinDone && (
          <button
            onClick={() => {
              platform.haptic(
                'light',
              )

              setSub(
                'checkin',
              )
            }}
            className="w-full rounded-3xl bg-emerald px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
          >
            <span className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
              <Sparkles
                size={16}
                className="text-gold"
                strokeWidth={1.75}
              />
            </span>


            <span className="flex-1 text-left">
              <span className="block text-[14px] font-bold text-cream">
                Как ты?
              </span>


              <span className="block text-[12px] text-cream/40 font-medium">
                Короткий чек-ин состояния
              </span>
            </span>


            <ChevronRight
              size={18}
              className="text-cream/30 shrink-0"
            />
          </button>
        )}


      {checkinDone && (
        <button
          onClick={() => {
            platform.haptic(
              'light',
            )

            setSub(
              'checkin',
            )
          }}
          className="w-full rounded-3xl bg-emerald/60 px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
        >
          <span className="w-9 h-9 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-bold shrink-0">
            ✓
          </span>


          <span className="flex-1 text-left">
            <span className="block text-[14px] font-bold text-cream">
              {eveningReviewDone
                ? 'День разобран'
                : 'Чек-ин выполнен'}
            </span>


            <span className="block text-[12px] text-cream/40 font-medium">
              {checkin.emotion
                ? `${checkin.emotion} · `
                : ''}
              настроение:{' '}
              {
                MOOD_WORDS[
                  (
                    checkin.mood
                    || 3
                  ) - 1
                ]
              }
            </span>
          </span>


          <span className="text-[12px] font-semibold text-cream/35 shrink-0">
            изменить
          </span>
        </button>
      )}


      {/* ======================================================
          ПУТЬ
          ====================================================== */}

      {!isEmpty && (
        <button
          onClick={() => {
            platform.haptic(
              'light',
            )

            setSub('path')
          }}
          className="w-full rounded-3xl bg-emerald px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
        >
          <ArrowUpRight
            size={18}
            className="text-gold shrink-0"
            strokeWidth={2}
          />


          <span className="text-[14px] font-bold text-cream whitespace-nowrap">
            Путь
          </span>


          <div className="flex-1 h-[5px] rounded-full bg-cream/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{
                width:
                  `${pct}%`,
              }}
            />
          </div>


          <span className="text-[13px] font-bold text-gold">
            {pct}%
          </span>


          <ChevronRight
            size={18}
            className="text-cream/30 shrink-0"
          />
        </button>
      )}


      {/* ======================================================
          ТЕМА НЕДЕЛИ
          ====================================================== */}

      {theme && (
        <button
          onClick={() => {
            platform.haptic(
              'light',
            )

            setSub(
              'theme',
            )
          }}
          className="w-full rounded-[28px] bg-emerald px-6 py-7 mt-4 text-center border-0 active:scale-[0.99] transition-transform animate-fade-in"
        >
          <span className="block text-[11px] text-cream/35 font-bold uppercase tracking-wider mb-2">
            Тема недели
          </span>


          <span className="block font-display text-[22px] text-cream lowercase leading-tight">
            {theme.title}
          </span>


          <span className="block text-[13px] text-cream/45 mt-2 leading-snug">
            {theme.subtitle}
          </span>


          <span className="flex items-center justify-center gap-1.5 mt-4">
            {Array.from({
              length:
                theme.total_days,
            }).map(
              (_, index) => (
                <span
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                    index
                    < theme.reflected_days
                      ? 'bg-gold'
                      : 'bg-cream/15'
                  }`}
                />
              ),
            )}
          </span>


          <span className="block text-[12px] text-cream/35 font-semibold mt-3">
            {theme.reflected_days > 0
              ? `Пройдено дней: ${theme.reflected_days} из ${theme.total_days}`
              : 'Начать неделю'}
          </span>
        </button>
      )}


      <QuickAdd
        onCheckin={() =>
          setSub(
            'checkin',
          )
        }
        onPractice={
          onOpenPractice
        }
        onMentor={
          onGoMentor
        }
      />


      {/* ======================================================
          МЫСЛЬ ДНЯ
          ====================================================== */}

      {dailyQuote && (
        <button
          onClick={() => {
            platform.haptic(
              'light',
            )

            setSub(
              'quote',
            )
          }}
          className="w-full rounded-[28px] bg-emerald px-6 py-8 mt-4 text-center animate-fade-in border-0 active:scale-[0.99] transition-transform"
        >
          <span className="block text-[12px] text-cream/40 font-semibold mb-3">
            Мысль дня
          </span>


          <span className="block font-display text-[19px] text-cream leading-snug">
            {dailyQuote}
          </span>


          <span className="block text-[11px] text-cream/30 font-semibold mt-4">
            открыть все →
          </span>
        </button>
      )}
    </div>
  )
}