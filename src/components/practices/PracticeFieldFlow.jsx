import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../../platform'
import { useBackButton } from '../../platform/telegram.hooks'
import { RoundBackButton } from '../NestedScreenHeader'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  getFullscreenPortalTarget,
} from '../../lib/fullscreenSurface'

/*
 * Экран-поле в стиле журнала: одна колонка вопросов, поле без рамки,
 * подсказка, чипсы-примеры и круглая кнопка (› → ✓).
 *
 * Один и тот же экран используют «Свой ритуал/аскеза» (создание) и
 * «Изменить» — отличаются только метка, шаги и обработчик сохранения.
 */
export default function PracticeFieldFlow({
  label,
  steps,
  initialValues = [],
  onSubmit,
  onCancel,
}) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState(0)
  const [values, setValues] = useState(() => steps.map((_, index) => initialValues[index] || ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // Системный «назад» совпадает с круглой кнопкой: шаг 1 → назад к списку,
  // шаг 2 → назад к первому шагу.
  useBackButton(step === 0 ? onCancel : () => setStep(0))

  const current = steps[step]
  const value = values[step]
  const canAdvance = value.trim().length > 0

  function setValue(next) {
    setValues(previous => previous.map((item, index) => (index === step ? next : item)))
  }

  useEffect(() => {
    // автофокус — клавиатура открыта сразу
    inputRef.current?.focus()
  }, [step])

  async function advance() {
    if (!canAdvance || saving) return
    if (step < steps.length - 1) {
      setStep(step + 1)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await onSubmit(values.map(item => item.trim()))
      if (!result) {
        setError('Не получилось сохранить. Проверь соединение и попробуй ещё раз.')
        setSaving(false)
      }
    } catch (e) {
      setError('Не получилось сохранить. Проверь соединение и попробуй ещё раз.')
      setSaving(false)
    }
  }

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow`} style={surfaceStyle}>
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mx-practice-flow__header px-[var(--mx-screen-x)]`}
      >
        <div className="w-full max-w-md mx-auto">
          <RoundBackButton onClick={step === 0 ? onCancel : () => setStep(0)} />
        </div>
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} mx-practice-flow__body`}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-col pt-4">
          <p className="mx-practice-own-step-label">
            {label} · {step + 1} / {steps.length}
          </p>
          <div className="mx-practice-own-progress">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`mx-practice-own-progress__bar${index <= step ? ' is-active' : ''}`}
              />
            ))}
          </div>

          <h2 className="mx-practice-own-question">{current.question}</h2>
          <p className="mx-practice-own-hint">{current.hint}</p>

          <input
            ref={inputRef}
            className="mx-practice-own-field"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={current.placeholder || '…'}
            maxLength={current.maxLength ?? undefined}
            aria-label={current.question}
            data-testid={`practice-own-input-${step}`}
          />

          {error && (
            <p role="alert" className="text-[13px] text-red-300 leading-relaxed mt-4">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="mx-practice-flow__footer px-[var(--mx-screen-x)] pb-4">
        <div className="w-full max-w-md mx-auto">
          <div className="mx-practice-own-bar">
            <div className="mx-practice-own-chips">
              {current.chips.map(chip => (
                <button
                  type="button"
                  key={chip}
                  className="mx-practice-own-chip"
                  onClick={() => {
                    platform.haptic('light')
                    setValue(chip)
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mx-practice-own-go"
              disabled={!canAdvance || saving}
              aria-label={step === steps.length - 1 ? 'Сохранить' : 'Далее'}
              data-testid="practice-own-go"
              onClick={advance}
            >
              {step === steps.length - 1 ? '✓' : '›'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
