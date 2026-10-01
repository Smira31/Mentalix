import { useState, useRef, useEffect, useMemo } from 'react'
import './ThemeQuestionCarousel.css'

/**
 * Determine if a card at the given index is "open" (accessible).
 * Card 0 is always open. Card N is open if card N-1 has a reflection.
 */
export function isCardOpen(questions, index) {
  if (index === 0) return true
  return !!questions[index - 1]?.reflection
}

/**
 * Shared Stoic-style question carousel for weekly themes.
 *
 * Used by PracticeCatalogV2 (Steps screen, maxCards=4) and
 * ThemeCarouselScreen (fullscreen, maxCards=7). Sequential opening:
 * card N is open only when card N-1 has a recorded reflection.
 *
 * Callbacks receive the question object (with .day, .text, .prompt,
 * .reflection) and the card index.
 */
export default function ThemeQuestionCarousel({
  questions,
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
      const scale = 1 - 0.25 * t
      card.style.transform = `scale(${scale.toFixed(4)})`
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

  // Initial scroll to initialIndex (only on first mount, not on data refresh)
  useEffect(() => {
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

    // Reapply scale whenever cards change (new reflections, theme switch)
    requestAnimationFrame(applyScale)
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
  const currentIsOpen = currentCard ? isCardOpen(cards, safeIndex) : false
  const currentIsAnswered = !!currentCard?.reflection

  function handleCTAClick() {
    if (!currentCard) return
    if (currentIsAnswered) {
      onViewAnswer?.(currentCard, safeIndex)
    } else if (currentIsOpen) {
      onWrite?.(currentCard, safeIndex)
    }
    // Closed: do nothing
  }

  let ctaLabel = 'Начать запись'
  let ctaDisabled = false
  if (currentIsAnswered) {
    ctaLabel = 'Посмотреть запись'
  } else if (!currentIsOpen) {
    ctaLabel = `Откроется после вопроса ${safeIndex}`
    ctaDisabled = true
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
          const open = isCardOpen(cards, i)
          const answered = !!q.reflection
          return (
            <article
              className="mx-tqc-card"
              key={q.day ?? i}
              data-open={open ? 'true' : 'false'}
              data-answered={answered ? 'true' : 'false'}
              data-active={i === safeIndex ? 'true' : 'false'}
              aria-label={`Вопрос ${q.day ?? i + 1}`}
            >
              <span className="mx-tqc-card__num">{q.day ?? i + 1}</span>
              {answered && (
                <span className="mx-tqc-card__check" aria-label="Записано">
                  ✓
                </span>
              )}
              <strong className="mx-tqc-card__question">{q.text}</strong>
              {q.prompt && <span className="mx-tqc-card__prompt">{q.prompt}</span>}
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
