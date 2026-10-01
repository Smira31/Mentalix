import { useEffect, useRef, useState } from 'react'
import { platform } from '../../platform'
import { useBackButton } from '../../platform/telegram.hooks'
import Screen from '../Screen'
import CapsLabel from '../ui/CapsLabel'
import JournalField from '../ui/JournalField'
import RoundNextButton from '../ui/RoundNextButton'

/*
 * Экран-поле в стиле журнала: одна колонка вопросов, поле без рамки,
 * подсказка, чипсы-примеры и круглая кнопка (› → ✓).
 *
 * Один и тот же экран используют «Свой ритуал/аскеза» (создание) и
 * «Изменить» — отличаются только метка, шаги и обработчик сохранения.
 *
 * Переведён на <Screen> + детали (CapsLabel, JournalField, RoundNextButton).
 * Вид и поведение не изменились.
 */
export default function PracticeFieldFlow({
  label,
  steps,
  initialValues = [],
  onSubmit,
  onCancel,
}) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState(() => steps.map((_, index) => initialValues[index] || ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // Системный «назад» совпадает с круглой кнопкой: шаг 1 → назад к списку,
  // шаг 2 → назад к первому шагу. Регистрируется здесь, а не в <Screen>
  // (registerSystemBack={false}), чтобы обработчик зависел от step.
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

  return (
    <Screen
      onBack={step === 0 ? onCancel : () => setStep(0)}
      backTestId="back-button"
      registerSystemBack={false}
      scroll={false}
      fullFrame
      footer={
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
          <RoundNextButton
            disabled={!canAdvance || saving}
            icon={step === steps.length - 1 ? 'check' : 'arrow'}
            label={step === steps.length - 1 ? 'Сохранить' : 'Далее'}
            testId="practice-own-go"
            onClick={advance}
          />
        </div>
      }
    >
      <CapsLabel className="mb-[14px]">
        {label} · {step + 1} / {steps.length}
      </CapsLabel>

      <div className="mx-practice-own-progress">
        {steps.map((_, index) => (
          <span
            key={index}
            className={`mx-practice-own-progress__bar${index <= step ? ' is-active' : ''}`}
          />
        ))}
      </div>

      <JournalField question={current.question} hint={current.hint} />

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
    </Screen>
  )
}
