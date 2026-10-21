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

export default function CheckInCompletion({ evening, onFeedback, children, title, art, body, feedbackQuestion, feedbackHint, showFeedback = true, datePill }) {
  const [selected, setSelected] = useState(null)
  const questionText = feedbackQuestion || (evening ? 'Был ли разбор полезен?' : 'Было полезно сегодня?')
  // #1078/#1084: пояснение под плитками — по умолчанию финалы чек-ина,
  // свой текст (журнал) передаётся пропом, чтобы не плодить копии экрана.
  const hintText =
    feedbackHint ||
    (evening
      ? 'Оценка по желанию — разбор дня уже сохранён.'
      : 'Оценка по желанию — чек-ин уже сохранён.')

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
      {/* Нижний блок финала — плашка даты, дополнительное содержимое и отзыв.
          Его высота задана полосой (.mx-completion__meta): на том же месте
          стоит ряд дней экрана серии, поэтому заголовок и герой не двигаются
          при переходе «Сохранить и выйти» → серия. */}
      <div className="mx-completion__meta">
        <div className="mx-completion__date-pill" aria-label="Дата">
          {datePill || (<><span aria-hidden="true">✓</span> {formatReviewDate()}</>)}
        </div>
        {body}
        {/* #1084: если оценка уже дана (повторное открытие записи),
            вопрос не показывается заново. */}
        {showFeedback && (
        <div className="mx-completion__feedback">
          <p>{questionText}</p>
          <div
            className="mx-completion__choices"
            role="group"
            aria-label={questionText}
          >
            {CHECKIN_FEEDBACK_OPTIONS.map(option => {
              const Icon = ICONS[option.value]
              return (
                <button
                  key={option.value}
                  type="button"
                  data-testid="checkin-feedback-option"
                  data-value={option.value}
                  /* #1084: короткое «Да» без контекста непонятно при
                     навигации с клавиатуры/скринридера — имя плитки
                     включает вопрос. */
                  aria-label={`${questionText} — ${option.label}`}
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
          {/* #1078: оценка на экране завершения читалась как обязательный шаг,
              а «Сохранить и выйти» — как само сохранение. Поясняем оба: оценка
              добровольна, запись дня к этому моменту уже сохранена, поэтому
              выход без оценки ничего не теряет. */}
          <p className="mx-completion__feedback-hint" data-testid="checkin-feedback-hint">
            {hintText}
          </p>
        </div>
        )}
      </div>
      {children}
    </section>
  )
}
