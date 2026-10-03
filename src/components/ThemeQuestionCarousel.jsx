import { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react'
import { themeOpeningLabel } from '../lib/mskDate'
import './ThemeQuestionCarousel.css'

/** Доступность задаётся календарным днём из ответа сервера. */
export function isCardOpen(day, currentDay) {
  return day <= currentDay
}

/** Общая карусель вопросов; callbacks получают выбранный вопрос и индекс. */
export default function ThemeQuestionCarousel({
  questions,
  currentDay = 1,
  startedOn,
  serverDate,
  onWrite,
  onViewAnswer,
  maxCards,
  initialIndex = 0,
  ctaTestId = 'theme-carousel-cta',
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const trackRef = useRef(null)
  const rafRef = useRef(null)
  const lastIndexRef = useRef(initialIndex)
  const initialScrollDone = useRef(false)

  const cards = useMemo(
    () => (Array.isArray(questions) ? questions.slice(0, maxCards ?? questions.length) : []),
    [questions, maxCards]
  )

  function applyScale() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const cardEls = [...track.querySelectorAll('.mx-tqc-card')]
    if (!cardEls.length) return
    const center = track.scrollLeft + track.clientWidth / 2
    cardEls.forEach(card => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const distance = Math.abs(cardCenter - center)
      const t = Math.min(distance / card.offsetWidth, 1)
      // Active card: 322px, neighbors: 243px (~75%)
      const h = Math.round(322 - 79 * t)
      card.style.height = `${h}px`
    })
  }

  function handleScroll() {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      applyScale()
      const track = trackRef.current
      if (!track) return
      const cardEls = [...track.querySelectorAll('.mx-tqc-card')]
      const center = track.scrollLeft + track.clientWidth / 2
      let next = 0
      let minDist = Infinity
      cardEls.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
        if (dist < minDist) {
          minDist = dist
          next = i
        }
      })
      if (next !== lastIndexRef.current) {
        lastIndexRef.current = next
        setActiveIndex(next)
      }
    })
  }

  // Initial scroll to selected day + apply scale.
  // useLayoutEffect runs before paint to avoid a flash of wrong position.
  useLayoutEffect(() => {
    if (!trackRef.current || !cards.length) return

    if (!initialScrollDone.current) {
      initialScrollDone.current = true
      const track = trackRef.current
      const cardEls = [...track.querySelectorAll('.mx-tqc-card')]
      const idx = Math.min(initialIndex, cardEls.length - 1)
      const card = cardEls[idx]
      if (card) {
        track.scrollTo({
          left: card.offsetLeft - track.clientWidth / 2 + card.offsetWidth / 2,
        })
      }
      lastIndexRef.current = idx
      setActiveIndex(idx)
    }

    // Apply scale immediately — layout is ready at this point
    applyScale()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards])

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  const safeIndex = Math.min(activeIndex, Math.max(0, cards.length - 1))
  const currentCard = cards[safeIndex]
  const currentIsOpen = currentCard
    ? isCardOpen(currentCard.day ?? safeIndex + 1, currentDay)
    : false
  const currentIsAnswered = !!currentCard?.reflection

  // Одно действие для кнопки под каруселью и для тапа по самой карточке.
  function activateCard(index) {
    const card = cards[index]
    if (!card || !isCardOpen(card.day ?? index + 1, currentDay)) return
    if (card.reflection) {
      onViewAnswer?.(card, index)
    } else {
      onWrite?.(card, index)
    }
  }

  function handleCTAClick() {
    activateCard(safeIndex)
  }

  let ctaLabel = 'Начать запись'
  let ctaDisabled = false
  if (!currentIsOpen) {
    ctaLabel = themeOpeningLabel(currentCard?.day ?? safeIndex + 1, startedOn, serverDate)
    ctaDisabled = true
  } else if (currentIsAnswered) {
    ctaLabel = 'Посмотреть запись'
  }

  if (!cards.length) return null

  return (
    <>
      <div
        className="mx-tqc-track"
        ref={trackRef}
        onScroll={handleScroll}
        role="region"
        aria-label="Вопросы темы"
      >
        {cards.map((q, i) => {
          const open = isCardOpen(q.day ?? i + 1, currentDay)
          const answered = !!q.reflection
          const openingLabel = open
            ? null
            : themeOpeningLabel(q.day ?? i + 1, startedOn, serverDate)
          return (
            <article
              className="mx-tqc-card"
              key={q.day ?? i}
              data-day={q.day ?? i + 1}
              data-open={open ? 'true' : 'false'}
              data-answered={answered ? 'true' : 'false'}
              data-active={i === safeIndex ? 'true' : 'false'}
              aria-label={`Вопрос ${q.day ?? i + 1}${openingLabel ? `. ${openingLabel}` : ''}`}
              role="button"
              tabIndex={0}
              aria-disabled={open ? undefined : 'true'}
              data-testid="theme-carousel-card"
              onClick={() => activateCard(i)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  activateCard(i)
                }
              }}
            >
              <span className="mx-tqc-card__num" data-testid="theme-card-day">
                {q.day ?? i + 1}
              </span>
              <strong
                className="mx-tqc-card__question"
                data-testid="theme-card-question"
                aria-hidden={open ? undefined : 'true'}
              >
                {q.text}
              </strong>
              {q.prompt && (
                <span
                  className="mx-tqc-card__prompt"
                  data-testid="theme-card-prompt"
                  aria-hidden={open ? undefined : 'true'}
                >
                  {q.prompt}
                </span>
              )}
              {!open && (
                <span className="mx-tqc-card__prompt" data-testid="theme-opening-label">
                  {openingLabel}
                </span>
              )}
            </article>
          )
        })}
      </div>

      <span
        className="mx-tqc-dots"
        role="img"
        aria-label={`Вопрос ${safeIndex + 1} из ${cards.length}`}
      >
        {cards.map((q, i) => (
          <i
            key={q.day ?? i}
            data-active={i === safeIndex ? 'true' : undefined}
            aria-hidden="true"
          />
        ))}
      </span>

      <button
        type="button"
        className="mx-tqc-cta"
        data-testid={ctaTestId}
        data-disabled={ctaDisabled ? 'true' : 'false'}
        disabled={ctaDisabled}
        onClick={handleCTAClick}
      >
        {ctaLabel}
      </button>
    </>
  )
}
