import { ArrowRight, Check, ChevronRight, X } from 'lucide-react'

const ICONS = { arrow: ArrowRight, x: X, chevron: ChevronRight, check: Check }

/*
 * Круглая светлая кнопка «→» / «✓» / «✕» — одна на редактор (JournalTextarea)
 * и шаги чек-ина (CheckInNextControls). Размер 45px и цвета задаёт
 * WritingControls.css для обоих контейнеров.
 *
 * crossfade — для шагов, где иконка меняется на ходу (чек-ин: пусто → «✕»,
 * есть выбор → «→»): обе иконки остаются в разметке, видимая переключается
 * прозрачностью, поэтому смена читается как плавная, а не как подмена.
 */
export default function RoundSubmitButton({
  label,
  testId,
  onClick,
  disabled = false,
  icon = 'arrow',
  crossfade = false,
}) {
  const Icon = ICONS[icon] ?? Check

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
      {crossfade && (icon === 'arrow' || icon === 'x') ? (
        <span className="mx-round-submit-swap" aria-hidden="true">
          <ArrowRight size={25} strokeWidth={2.4} className={icon === 'arrow' ? 'is-on' : ''} />
          <X size={25} strokeWidth={2.4} className={icon === 'x' ? 'is-on' : ''} />
        </span>
      ) : (
        <Icon size={25} strokeWidth={2.4} />
      )}
    </button>
  )
}
