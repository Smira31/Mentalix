import { useState } from 'react'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'
import { CHECKIN_FEEDBACK_OPTIONS } from '../lib/checkinFeedback'
import './CheckInCompletion.css'

const ICONS = { no: ThumbsDown, some: Hand, yes: ThumbsUp }

function CompletionFlower() {
  return (
    <svg className="mx-completion__flower" viewBox="0 0 100 120" aria-hidden="true">
      <g fill="rgb(var(--c-text))">
        <path d="M47 64c-16-8-27-4-27-15 0-7 6-10 14-9-9-7-7-18 1-21 7-3 12 1 15 9 2-11 9-15 16-12 8 4 8 13 2 21 10-4 18 0 18 8 0 10-10 13-22 12-4 8-13 11-17 7Z" />
        <path d="M49 60c3 16 4 34 3 52h6c1-20-1-39-4-53Z" />
        <path d="M54 93c-13-15-26-13-28-11 3 14 15 19 28 17Z" />
      </g>
      <circle cx="52" cy="45" r="6" fill="rgb(var(--c-bg))" />
      <path d="M54 94c-9-8-16-10-22-10" fill="none" stroke="rgb(var(--c-bg))" strokeWidth="2" />
    </svg>
  )
}

export default function CheckInCompletion({ evening, onFeedback, children }) {
  const [selected, setSelected] = useState(null)

  return (
    <section className="mx-completion" data-testid="checkin-completion">
      <CompletionFlower />
      <h1 className="mx-completion__title">
        <span>{evening ? 'Ты завершил' : 'Ты прошёл'}</span>
        <strong>{evening ? 'Разбор дня!' : 'Утренний чек-ин!'}</strong>
      </h1>
      <div className="mx-completion__feedback">
        <p>Было полезно сегодня?</p>
        <div className="mx-completion__choices" role="group" aria-label="Было полезно сегодня?">
          {CHECKIN_FEEDBACK_OPTIONS.map(option => {
            const Icon = ICONS[option.value]
            return (
              <button
                key={option.value}
                type="button"
                data-testid="checkin-feedback-option"
                data-value={option.value}
                aria-pressed={selected === option.value}
                className={selected === option.value ? 'is-selected' : ''}
                onClick={() => {
                  const next = selected === option.value ? null : option.value
                  setSelected(next)
                  if (next) onFeedback(option.label)
                }}
              >
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      {children}
    </section>
  )
}
