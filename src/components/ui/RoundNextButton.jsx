import { ArrowRight, Check, X } from 'lucide-react'

/*
 * <RoundNextButton> — круглая кнопка «→» / «✓» / «✕».
 * 45px (--mx-btn-round-h), серая когда disabled.
 * icon='close' — вариант «пропустить»: прозрачный фон, рамка, бледная иконка.
 * Используется над клавиатурой и в шаговых потоках.
 */
export default function RoundNextButton({
  onClick,
  disabled = false,
  icon = 'arrow',
  testId,
  label,
  className = '',
  style,
}) {
  const skipClass = icon === 'close' ? 'mx-round-next-btn--skip' : ''
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`mx-round-next-btn mx-tap-target ${skipClass} ${className}`}
      style={style}
    >
      {icon === 'check' ? (
        <Check size={25} strokeWidth={2.4} />
      ) : icon === 'close' ? (
        <X size={22} strokeWidth={2.2} />
      ) : (
        <ArrowRight size={25} strokeWidth={2.4} />
      )}
    </button>
  )
}
