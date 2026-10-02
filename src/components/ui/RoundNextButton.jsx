import { ArrowRight, Check, X } from 'lucide-react'

/*
 * <RoundNextButton> — круглая белая кнопка «→» / «✓» / «✕».
 * 45px (--mx-btn-round-h), серая когда disabled.
 * ✕ и ✓ одинаково заметные (белый фон) — ✕ = назад, ✓ = дальше/сохранить.
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
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`mx-round-next-btn mx-tap-target ${className}`}
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
