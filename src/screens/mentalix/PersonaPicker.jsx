import {
  useEffect,
  useRef,
  useState,
} from 'react'

import WebApp from '@twa-dev/sdk'

import { api } from '../../lib/api'
import Motif, { motifForPersona } from '../../components/Motif'
import { PERSONAS } from './personas'


/*
 * ВЫБОР СОБЕСЕДНИКА
 *
 * Раньше это был вертикальный список из трёх узких карточек:
 * персоны отличались только названием и выглядели как пункты
 * меню. Теперь каждая занимает почти весь экран и листается
 * вбок — одна персона за раз, с характером и своим местом.
 *
 * Листание сделано нативным горизонтальным скроллом со
 * snap-точками, а не самописной обработкой касаний. Причина
 * практическая: внутри Telegram Mini App собственные обработчики
 * жестов конфликтуют с жестами самого Telegram, и мы это уже
 * проходили с блокировкой зума. Нативный скролл ведёт себя
 * предсказуемо, работает с инерцией и ничего не перехватывает.
 *
 * overscroll-x-contain нужен, чтобы свайп в конце ленты не
 * уходил дальше — в жест закрытия окна.
 */


/*
 * Карточка тянется до нижней навигации, а не живёт фиксированной
 * высотой. Вычитаем из высоты видимой области всё, что занято
 * не карточкой: контролы Telegram, заголовок экрана, точки и
 * подпись снизу, зарезервированное место под навигацию.
 */
const CARD_HEIGHT = {
  height:
    'calc(100dvh - var(--app-safe-top) - var(--app-safe-bottom) - 331px)',
  minHeight: '360px',
}


function haptic(
  style = 'light',
) {
  WebApp.HapticFeedback?.impactOccurred(
    style,
  )
}


function trim(
  text,
  max = 90,
) {
  const clean = String(
    text || '',
  )
    .replace(/\s+/g, ' ')
    .trim()

  return clean.length > max
    ? `${clean
        .slice(0, max)
        .trimEnd()}…`
    : clean
}


export default function PersonaPicker({
  user,
  onPick,
}) {
  const [
    previews,
    setPreviews,
  ] = useState({})

  const [active, setActive] =
    useState(0)

  const trackRef = useRef(null)


  useEffect(() => {
    if (!user) return

    let alive = true

    Promise.all(
      PERSONAS.map(
        (persona) =>
          api.mentalix
            .history(
              user.id,
              persona.key,
            )
            .then(
              (messages) => [
                persona.key,
                Array.isArray(
                  messages,
                )
                  ? messages[
                      messages.length -
                        1
                    ]
                  : null,
              ],
            )
            .catch(() => [
              persona.key,
              null,
            ]),
      ),
    ).then((pairs) => {
      if (!alive) return

      const next = {}

      pairs.forEach(
        ([key, last]) => {
          if (last?.content) {
            next[key] = last
          }
        },
      )

      setPreviews(next)
    })

    return () => {
      alive = false
    }
  }, [user])


  function syncActive() {
    const track = trackRef.current

    if (!track) return

    const card =
      track.firstElementChild

    if (!card) return

    const step =
      card.offsetWidth + 12

    setActive(
      Math.round(
        track.scrollLeft / step,
      ),
    )
  }


  return (
    <div className="w-full max-w-md px-5 animate-fade-in">
      <h2 className="font-display text-[30px] text-cream lowercase mt-4 mb-1">
        с кем говорим.
      </h2>

      <p className="text-[12px] text-cream/35 mb-6">
        три собеседника, три отдельных разговора
      </p>


      <div
        ref={trackRef}
        onScroll={syncActive}
        className="
          flex
          gap-3
          -mx-5
          px-5
          pb-2
          overflow-x-auto
          overscroll-x-contain
          snap-x
          snap-mandatory
          [&::-webkit-scrollbar]:hidden
        "
        style={{
          scrollbarWidth: 'none',
        }}
      >
        {PERSONAS.map(
          (persona) => {
            const last =
              previews[
                persona.key
              ]

            return (
              /*
               * Вся карточка — это вход в разговор. Раньше
               * открыть персону можно было только через
               * нижнюю кнопку, хотя нажать хочется на саму
               * карточку: она и есть выбор.
               */
              <div
                key={persona.key}
                role="button"
                tabIndex={0}
                onClick={() => {
                  haptic('light')
                  onPick(persona.key, '')
                }}
                className="
                  snap-center
                  shrink-0
                  w-[82%]
                  rounded-[28px]
                  border
                  border-cream/12
                  bg-emerald
                  p-6
                  flex
                  flex-col
                  cursor-pointer
                  active:scale-[0.99]
                  transition-transform
                "
                style={CARD_HEIGHT}
              >
                {/*
                  * Верхняя треть карточки — рисунок. Он занимает
                  * долю высоты, а не фиксированные пиксели: карточка
                  * тянется до нижнего меню и на разных экранах имеет
                  * разную высоту.
                  */}
                <div className="-mx-6 basis-1/3 shrink-0 min-h-0 text-gold">
                  <Motif
                    name={motifForPersona(persona.key)}
                    className="w-full h-full"
                  />
                </div>


                <div className="font-display text-[22px] text-cream leading-tight mt-4">
                  {persona.name}
                </div>

                <div className="text-[12px] text-gold mt-1.5">
                  {persona.tagline}
                </div>

                <p className="text-[14px] text-cream/50 leading-snug mt-3">
                  {persona.desc}
                </p>


                <div className="mt-auto pt-6">
                  {last ? (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()

                        haptic('light')

                        onPick(
                          persona.key,
                          '',
                        )
                      }}
                      className="w-full text-left rounded-[20px] bg-emerald-light border border-cream/10 px-4 py-3.5 active:scale-[0.99] transition-transform"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-gold mb-1">
                        Продолжить разговор
                      </div>

                      <p className="text-[13px] text-cream/55 leading-snug">
                        {last.role === 'user'
                          ? 'Ты: '
                          : ''}

                        {trim(last.content)}
                      </p>
                    </button>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {persona.starters.map(
                          (starter) => (
                            <button
                              key={starter}
                              onClick={(event) => {
                                event.stopPropagation()

                                haptic('light')

                                onPick(
                                  persona.key,
                                  starter,
                                )
                              }}
                              className="rounded-full border border-cream/15 bg-emerald-light px-3.5 py-2 text-[12px] text-cream/70 active:scale-95 transition-transform"
                            >
                              {starter}
                            </button>
                          ),
                        )}
                      </div>

                      <button
                        onClick={() => {
                          haptic('light')

                          onPick(
                            persona.key,
                            '',
                          )
                        }}
                        className="cta-pill w-full py-3.5 text-[15px]"
                      >
                        Говорить
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          },
        )}
      </div>


      {/* ── точки ── */}

      <div className="flex justify-center gap-1.5 mt-4">
        {PERSONAS.map(
          (persona, index) => (
            <span
              key={persona.key}
              className={[
                'h-[3px] rounded-full transition-all duration-200',
                index === active
                  ? 'w-5 bg-gold'
                  : 'w-4 bg-cream/15',
              ].join(' ')}
            />
          ),
        )}
      </div>


      <p className="text-[11px] text-cream/30 leading-snug mt-6 text-center">
        У каждого своя история — разговоры не смешиваются.
      </p>
    </div>
  )
}
