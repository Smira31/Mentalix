import { ArrowRight, Check, ChevronRight, X } from 'lucide-react'

/*
 * Круглая светлая кнопка «→» / «✓» — одна на редактор (JournalTextarea)
 * и шаги чек-ина (CheckInNextControls). Размер 45px и цвета задаёт
 * WritingControls.css для обоих контейнеров.
 */
export default function RoundSubmitButton({
  label,
  testId,
  onClick,
  disabled = false,
  icon = 'arrow',
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className="mx-keyboard-control mx-keyboard-submit mx-tap-target flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full border border-[rgb(var(--c-border))] bg-[#F2F2F2] text-emerald-deep transition-transform active:scale-95 disabled:opacity-35"
    >
      {icon === 'arrow' ? (
        <ArrowRight size={25} strokeWidth={2.4} />
      ) : icon === 'x' ? (
        <X size={25} strokeWidth={2.4} />
      ) : icon === 'chevron' ? (
        <ChevronRight size={25} strokeWidth={2.4} />
      ) : (
        <Check size={25} strokeWidth={2.4} />
      )}
    </button>
  )
}
