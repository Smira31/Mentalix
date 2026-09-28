import { useState } from 'react'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'
import { CHECKIN_FEEDBACK_OPTIONS } from '../lib/checkinFeedback'
import CompletionArtMorning from './CompletionArtMorning'
import CompletionArtEvening from './CompletionArtEvening'
import './CheckInCompletion.css'

const ICONS = { no: ThumbsDown, some: Hand, yes: ThumbsUp }

export default function CheckInCompletion({ evening, onFeedback, children }) {
  const [selected, setSelected] = useState(null)

  return (
    <section className="mx-completion" data-testid="checkin-completion">
      {evening ? <CompletionArtEvening /> : <CompletionArtMorning />}
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
