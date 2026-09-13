import { useEffect, useRef, useState } from 'react'

import { platform } from '../../platform'
import SemanticGlyph, { semanticKindForPersona } from '../../components/SemanticGlyph'
import { fetchHistory } from '../../lib/mentalixHistoryCache'
import { PERSONAS } from './personas'

import './PersonaPicker.css'

const DEFAULT_INDEX = 0

const PROMISES = {
  mayak: 'Поможет разобраться в том, что чувствуешь.',
  kompas: 'Поможет увидеть новые перспективы и найти решение.',
  dnevnik: 'Поможет исследовать свои мысли и эмоции глубже.',
}

function trim(text, max = 96) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

function HeadContours() {
  return (
    <svg
      className="mx-dialog-heads__svg"
      viewBox="0 0 390 330"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="mx-dialog-head mx-dialog-head--left">
        <path d="M245 40c-32-22-75-25-109-6-32 18-50 47-53 82-3 28 5 51 18 69 8 11 11 25 8 39-4 19-16 35-34 48l-18 13c-9 6-12 18-6 26 6 9 18 12 28 7l51-24c19-9 34-24 44-42l13-24c6-12 16-20 29-23 32-8 57-30 67-61 13-39 0-80-38-104Z" />
        <path d="M245 40c-18 22-22 43-14 63 6 15 18 24 35 28" />
      </g>
      <g className="mx-dialog-head mx-dialog-head--right">
        <path d="M245 40c-32-22-75-25-109-6-32 18-50 47-53 82-3 28 5 51 18 69 8 11 11 25 8 39-4 19-16 35-34 48l-18 13c-9 6-12 18-6 26 6 9 18 12 28 7l51-24c19-9 34-24 44-42l13-24c6-12 16-20 29-23 32-8 57-30 67-61 13-39 0-80-38-104Z" />
        <path d="M245 40c-18 22-22 43-14 63 6 15 18 24 35 28" />
      </g>
    </svg>
  )
}

function RoleGlyph({ persona, active }) {
  return (
    <div className="mx-dialog-role-glyph" aria-hidden="true">
      <SemanticGlyph
        kind={semanticKindForPersona(persona.key)}
        animated={active}
        highlighted={active}
        className="mx-dialog-role-glyph__svg"
      />
    </div>
  )
}

export default function PersonaPicker({ user, onPick }) {
  const [previews, setPreviews] = useState({})
  const [previewsLoading, setPreviewsLoading] = useState(true)
  const [active, setActive] = useState(DEFAULT_INDEX)
  const trackRef = useRef(null)

  useEffect(() => {
    if (!user) return undefined
    let alive = true
    Promise.all(
      PERSONAS.map(persona =>
        fetchHistory(user.id, persona.key)
          .then(messages => [persona.key, Array.isArray(messages) ? messages.at(-1) : null])
          .catch(() => [persona.key, null])
      )
    )
      .then(pairs => {
        if (!alive) return
        setPreviews(Object.fromEntries(pairs.filter(([, last]) => last?.content)))
      })
      .finally(() => alive && setPreviewsLoading(false))
    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    const track = trackRef.current
    const card = track?.children[DEFAULT_INDEX]
    if (!track || !card) return
    const frame = requestAnimationFrame(() => {
      track.scrollTo({
        left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
        behavior: 'auto',
      })
      syncActive()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  function syncActive() {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let distance = Infinity
    Array.from(track.children).forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      if (Math.abs(cardCenter - center) < distance) {
        closest = index
        distance = Math.abs(cardCenter - center)
      }
    })
    setActive(closest)
  }

  function selectRole(index) {
    const track = trackRef.current
    const card = trackRef.current?.children[index]
    if (!track || !card) return
    platform.haptic('light')
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: 'smooth',
    })
    setActive(index)
  }

  function startRole(persona) {
    platform.haptic('light')
    onPick(persona.key, '')
  }

  return (
    <main className="mx-dialog-entry" data-testid="dialog-entry">
      <section className="mx-dialog-hero" aria-labelledby="dialog-entry-title">
        <div className="mx-dialog-heads" aria-hidden="true">
          <HeadContours />
        </div>
        <div className="mx-dialog-hero__content">
          <p className="mx-dialog-eyebrow">Д И А Л О Г</p>
          <h1 id="dialog-entry-title">
            О чём хочешь
            <br />
            поговорить
            <br />
            <strong>прямо сейчас?</strong>
          </h1>
          <button
            type="button"
            className="mx-dialog-start"
            onClick={() => startRole(PERSONAS[active])}
            aria-label={`Начать разговор: ${PERSONAS[active].name}`}
          >
            Начать
          </button>
        </div>
      </section>

      <section className="mx-dialog-surface" aria-labelledby="dialog-role-title">
        <div className="mx-dialog-surface__header">
          <p className="mx-dialog-surface__kicker">для разговора</p>
          <h2 id="dialog-role-title">
            Выбери роль
            <br />
            для разговора.
          </h2>
        </div>
        <div
          ref={trackRef}
          className="mx-dialog-carousel"
          data-testid="mentor-persona-track"
          role="region"
          aria-label="Выбор роли для разговора"
          onScroll={syncActive}
        >
          {PERSONAS.map((persona, index) => {
            const last = previews[persona.key]
            const isActive = active === index
            return (
              <article
                key={persona.key}
                className={`mx-dialog-card ${isActive ? 'is-active' : ''}`}
                data-testid="mentor-persona-card"
                aria-label={`${persona.name}: ${PROMISES[persona.key]}`}
                aria-current={isActive ? 'true' : undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => !isActive && selectRole(index)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectRole(index)
                  }
                }}
              >
                <RoleGlyph persona={persona} active={isActive} />
                <div className="mx-dialog-card__body">
                  <p className="mx-dialog-card__role">{persona.name}</p>
                  <h3>{PROMISES[persona.key]}</h3>
                  <p className="mx-dialog-card__description">{persona.desc}</p>
                  {last && !previewsLoading && (
                    <p className="mx-dialog-card__history">
                      Последний разговор: {trim(last.content, 70)}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
        <div className="mx-dialog-dots" role="group" aria-label="Выбор роли">
          {PERSONAS.map((persona, index) => (
            <button
              type="button"
              key={persona.key}
              aria-label={`${persona.name}, ${index + 1} из ${PERSONAS.length}`}
              aria-current={active === index ? 'true' : undefined}
              onClick={() => selectRole(index)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

export { PROMISES }
