import { useEffect, useRef, useState } from 'react'

import { platform } from '../../platform'
import { PERSONAS } from './personas'
import heroReference from '../../assets/dialog-hero-reference.png'
import { isPreviewDemoMode } from '../../lib/demoMode'

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
  kompas: 'Строгий и честный. Разложит цель на шаги и не даст себя жалеть.',
  dnevnik: 'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
}

export default function PersonaPicker({ onPick }) {
  const [active, setActive] = useState(DEFAULT_INDEX)
  const trackRef = useRef(null)
  const previewDemoMode = isPreviewDemoMode()

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
            const isActive = active === index
            const useDemoMentorCopy = previewDemoMode && persona.key === 'kompas'
            const promise = useDemoMentorCopy ? persona.tagline : PROMISES[persona.key]
            const description = useDemoMentorCopy ? persona.desc : DIALOG_DESCRIPTIONS[persona.key]
            return (
              <article
                key={persona.key}
                className={`mx-dialog-card mx-card-surface ${isActive ? 'is-active' : ''}`}
                data-testid="mentor-persona-card"
                aria-label={`${persona.name}: ${promise}`}
                aria-current={isActive ? 'true' : undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectRole(index)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectRole(index)
                  }
                }}
              >
                <div className="mx-dialog-card__body">
                  <p className="mx-dialog-card__role mx-type-meta font-label">{persona.name}</p>
                  <h3 className="mx-type-persona-title">{persona.name}</h3>
                  <p className="mx-dialog-card__promise">{promise}</p>
                  <p className="mx-dialog-card__description mx-type-persona-body">{description}</p>
                  <button
                    type="button"
                    className="mx-dialog-card__start mx-type-control"
                    onClick={event => {
                      event.stopPropagation()
                      startRole(persona)
                    }}
                    aria-label={`Начать разговор: ${persona.name}`}
                  >
                    Начать
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export { PROMISES }
