import { useEffect, useRef, useState } from 'react'

import { platform } from '../../platform'

import { fetchHistory } from '../../lib/mentalixHistoryCache'
import SemanticGlyph, { semanticKindForPersona } from '../../components/SemanticGlyph'
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
/*
 * Верхний предел обязателен. Высота считается от 100dvh, и на
 * телефоне это даёт ~470px — то, подо что карточка рисовалась.
 * На широком экране Telegram Desktop то же выражение даёт под
 * семьсот, карточка растягивается и рисунок с текстом расползаются.
 * На телефоне min() ничего не меняет: там всегда выигрывает calc.
 */
const CARD_HEIGHT = {
  height: 'min(620px, calc(100dvh - var(--app-safe-top) - var(--app-safe-bottom) - 220px))',
  minHeight: '400px',
}

function trim(text, max = 90) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()

  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

export default function PersonaPicker({ user, onPick }) {
  const [previews, setPreviews] = useState({})

  const [previewsLoading, setPreviewsLoading] = useState(true)

  const [active, setActive] = useState(0)

  const trackRef = useRef(null)

  useEffect(() => {
    if (!user) return

    let alive = true

    Promise.all(
      PERSONAS.map(persona =>
        fetchHistory(user.id, persona.key)
          .then(messages => [
            persona.key,
            Array.isArray(messages) ? messages[messages.length - 1] : null,
          ])
          .catch(() => [persona.key, null])
      )
    )
      .then(pairs => {
        if (!alive) return

        const next = {}

        pairs.forEach(([key, last]) => {
          if (last?.content) {
            next[key] = last
          }
        })

        setPreviews(next)
      })
      .finally(() => {
        if (alive) setPreviewsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [user])

  function syncActive() {
    const track = trackRef.current

    if (!track) return

    const card = track.firstElementChild

    if (!card) return

    const step = card.offsetWidth + 12

    setActive(Math.max(0, Math.min(PERSONAS.length - 1, Math.round(track.scrollLeft / step))))
  }

  function selectPage(index) {
    const track = trackRef.current
    const card = track?.firstElementChild

    if (!track || !card) return

    platform.haptic('light')
    track.scrollTo({ left: index * (card.offsetWidth + 12), behavior: 'smooth' })
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 animate-fade-in">
      <h2 className="font-display mx-type-page text-cream lowercase mt-0 mb-2">с кем говорим.</h2>

      <p className="mx-type-meta text-faint mb-4">три собеседника, три отдельных разговора</p>

      <div className="mt-4">
        <div
          ref={trackRef}
          data-testid="mentor-persona-track"
          onScroll={syncActive}
          className="
          flex
          gap-3
          -mx-4
          px-4
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
          {PERSONAS.map((persona, index) => {
            const last = previews[persona.key]

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
                data-testid="mentor-persona-card"
                tabIndex={0}
                onClick={() => {
                  platform.haptic('light')
                  onPick(persona.key, '')
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    platform.haptic('light')
                    onPick(persona.key, '')
                  }
                }}
                aria-label={`${persona.name}: открыть разговор`}
                className={`
                  snap-center
                  shrink-0
                  w-full
                  rounded-[32px]
                  border border-gold/20
                  bg-gold/[0.04]
                  p-6
                  flex
                  flex-col
                  cursor-pointer
                  active:scale-[0.99]
                  transition-transform
                `}
                style={CARD_HEIGHT}
              >
                {/*
                 * Верхняя треть карточки — рисунок. Он занимает
                 * долю высоты, а не фиксированные пиксели: карточка
                 * тянется до нижнего меню и на разных экранах имеет
                 * разную высоту.
                 */}
                <div className="-mx-6 -mt-6 mb-1 basis-[42%] shrink-0 min-h-0 bg-artbed rounded-t-[28px] border-b border-cream/[0.06] overflow-hidden px-1">
                  <SemanticGlyph
                    kind={semanticKindForPersona(persona.key)}
                    animated={active === index}
                    highlighted={active === index}
                    className="w-full h-full scale-[1.06]"
                  />
                </div>

                <div className="font-display mx-type-persona-title text-cream mt-3 mx-persona-card__title">
                  {persona.name}
                </div>

                <div className="mx-ai-meta text-gold mt-1.5 mx-persona-card__tagline">
                  {persona.tagline}
                </div>

                <p className="mx-type-persona-body text-muted mt-2.5 mx-persona-card__description">
                  {persona.desc}
                </p>

                <div className="mt-auto pt-3 mx-persona-card__actions">
                  {previewsLoading ? (
                    /*
                     * Пока fetchHistory не резолвился, last === undefined —
                     * неотличимо от «истории нет». Без этого нейтрального
                     * состояния карточка на первом кадре всегда показывала бы
                     * «Говорить», а через мгновение резко переключалась на
                     * «Продолжить разговор» — мигание с неверным кадром.
                     */
                    <div
                      aria-hidden="true"
                      className="w-full rounded-[20px] bg-emerald-light/40 border border-cream/10 px-4 py-3.5 animate-pulse"
                    >
                      <div className="h-[10px] w-24 rounded-full bg-cream/10 mb-2" />
                      <div className="h-[13px] w-full rounded-full bg-cream/10" />
                    </div>
                  ) : last ? (
                    <button
                      onClick={event => {
                        event.stopPropagation()

                        platform.haptic('light')

                        onPick(persona.key, '')
                      }}
                      className="w-full text-left rounded-[20px] bg-emerald-light border border-cream/10 px-4 py-3.5 active:scale-[0.99] transition-transform"
                    >
                      <div className="mx-ai-meta text-gold mb-1">Продолжить разговор</div>

                      <p className="mx-ai-caption text-muted">
                        {last.role === 'user' ? 'Ты: ' : ''}

                        {trim(last.content)}
                      </p>
                    </button>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3 mx-persona-card__starters">
                        {persona.starters.map(starter => (
                          <button
                            key={starter}
                            onClick={event => {
                              event.stopPropagation()

                              platform.haptic('light')

                              onPick(persona.key, starter)
                            }}
                            className="rounded-full border border-cream/15 bg-emerald-light px-3.5 py-2 text-[12px] text-muted active:scale-95 transition-transform mx-persona-card__starter"
                          >
                            {starter}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          platform.haptic('light')

                          onPick(persona.key, '')
                        }}
                        className="cta-pill mx-type-control w-full py-3.5 mx-persona-card__cta"
                      >
                        Говорить
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-end justify-center gap-2" aria-label="Страница собеседника">
          {PERSONAS.map((persona, index) => (
            <button
              type="button"
              key={persona.key}
              aria-label={`${persona.name}, страница ${index + 1} из ${PERSONAS.length}`}
              aria-current={active === index ? 'page' : undefined}
              onClick={() => selectPage(index)}
              className={[
                'w-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
                active === index ? 'h-8 bg-gold' : 'h-4 bg-cream/20 hover:bg-cream/40',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      <p className="mx-type-list-body mt-4 text-center leading-relaxed text-muted">
        У каждого своя история — разговоры не смешиваются.
      </p>
    </div>
  )
}
