import { useEffect, useRef, useState } from 'react'

import { platform } from '../../platform'
import SemanticGlyph, { semanticKindForPersona } from '../../components/SemanticGlyph'
import { fetchHistory } from '../../lib/mentalixHistoryCache'
import { PERSONAS } from './personas'
import heroReference from '../../assets/dialog-hero-reference.png'

import './PersonaPicker.css'

const DEFAULT_INDEX = 1

// Визуальный порядок entry-карусели задан reference screenshot. Сами persona
// keys и backend-контракт остаются прежними.
const DISPLAY_PERSONAS = [PERSONAS[1], PERSONAS[0], PERSONAS[2]]

const PROMISES = {
  mayak: 'Поможет разобраться в том, что чувствуешь.',
  kompas: 'Поможет увидеть новые перспективы и найти решения.',
  dnevnik: 'Поможет исследовать свои мысли и эмоции глубже.',
}

const DIALOG_DESCRIPTIONS = {
  mayak: 'Тёплый и внимательный разговор без оценки, когда нужно выговориться или услышать себя.',
  kompas: 'Поможет увидеть новые перспективы и найти решения.',
  dnevnik: 'Поможет исследовать свои мысли и эмоции глубже.',
}

function trim(text, max = 70) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
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
      DISPLAY_PERSONAS.map(persona =>
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
    if (!track || !card) return undefined
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
    const card = track?.children[index]
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
        <img className="mx-dialog-hero-reference" src={heroReference} alt="" aria-hidden="true" />
        <div className="mx-dialog-hero__content">
          <p className="mx-dialog-eyebrow font-label">ДИАЛОГ</p>
          <h1 id="dialog-entry-title" className="mx-type-hero">
            О чём хочешь поговорить прямо сейчас?
          </h1>
          <button
            type="button"
            className="mx-dialog-start cta-pill mx-type-control"
            onClick={() => startRole(DISPLAY_PERSONAS[active])}
            aria-label={`Начать разговор: ${DISPLAY_PERSONAS[active].name}`}
          >
            Начать
          </button>
        </div>
      </section>

      <section className="mx-dialog-surface" aria-labelledby="dialog-role-title">
        <div className="mx-dialog-surface__header">
          <h2 id="dialog-role-title" className="mx-type-section">
            <span>Выбери роль</span>
            <strong>для разговора.</strong>
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
          {DISPLAY_PERSONAS.map((persona, index) => {
            const last = previews[persona.key]
            const isActive = active === index
            return (
              <article
                key={persona.key}
                className={`mx-dialog-card mx-card-surface ${isActive ? 'is-active' : ''}`}
                data-testid="mentor-persona-card"
                aria-label={`${persona.name}: ${PROMISES[persona.key]}`}
                aria-current={isActive ? 'true' : undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => (isActive ? startRole(persona) : selectRole(index))}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectRole(index)
                  }
                }}
              >
                <RoleGlyph persona={persona} active={isActive} />
                <div className="mx-dialog-card__body">
                  <p className="mx-dialog-card__role mx-type-meta font-label">{persona.name}</p>
                  <h3 className="mx-type-persona-title">{persona.name}</h3>
                  <p className="mx-dialog-card__promise">{PROMISES[persona.key]}</p>
                  <p className="mx-dialog-card__description mx-type-persona-body">
                    {DIALOG_DESCRIPTIONS[persona.key]}
                  </p>
                  {last && !previewsLoading && (
                    <p className="mx-dialog-card__history mx-type-meta">
                      Последний разговор: {trim(last.content)}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
        <div className="mx-dialog-dots" role="group" aria-label="Выбор роли">
          {DISPLAY_PERSONAS.map((persona, index) => (
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
