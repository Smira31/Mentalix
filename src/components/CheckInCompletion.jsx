import { useState } from 'react'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'
import { CHECKIN_FEEDBACK_OPTIONS } from '../lib/checkinFeedback'
import CompletionArtMorning from './CompletionArtMorning'
import CompletionArtEvening from './CompletionArtEvening'
import './CheckInCompletion.css'

const ICONS = { no: ThumbsDown, some: Hand, yes: ThumbsUp }

function formatReviewDate() {
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
      .format(new Date())
      .replace(/\./g, '')
  } catch {
    return ''
  }
}

export default function CheckInCompletion({ evening, onFeedback, children, title, art }) {
  const [selected, setSelected] = useState(null)

  return (
    <section
      className={`mx-completion${evening ? ' mx-completion--evening' : ''}`}
      data-testid="checkin-completion"
    >
      <div className="mx-completion__art-wrap">
        {art || (evening ? <CompletionArtEvening /> : <CompletionArtMorning />)}
      </div>
      <h1 className="mx-completion__title">
        {title || (evening ? (
          <>
            <strong>Ты завершил</strong>
            <span>разбор дня.</span>
          </>
        ) : (
          <>
            <strong>Ты прошёл</strong>
            <span>утренний чек-ин.</span>
          </>
        ))}
      </h1>
      <div className="mx-completion__date-pill" aria-label="Дата">
        <span aria-hidden="true">✓</span> {formatReviewDate()}
      </div>
      <div className="mx-completion__feedback">
        <p>{evening ? 'Был ли разбор полезен?' : 'Было полезно сегодня?'}</p>
        <div
          className="mx-completion__choices"
          role="group"
          aria-label={evening ? 'Был ли разбор полезен?' : 'Было полезно сегодня?'}
        >
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
