import { ArrowRight, Check, ChevronRight, X } from 'lucide-react'

const ICONS = { arrow: ArrowRight, x: X, chevron: ChevronRight, check: Check }

/*
 * Круглая светлая кнопка «›» / «✓» / «✕» — одна на редактор (JournalTextarea)
 * и шаги чек-ина (CheckInNextControls). Размер 45px и цвета задаёт
 * WritingControls.css для обоих контейнеров.
 *
 * Вперёд ведёт один символ — шеврон «›» (DESIGN_SYSTEM.md §5.2: круглая кнопка
 * «далее» с шевроном): у стрелки «→» есть лишнее горизонтальное древко.
 *
 * crossfade — для шагов, где иконка меняется на ходу (чек-ин: пусто → «✕»,
 * есть выбор → «›»): обе иконки остаются в разметке, видимая переключается
 * прозрачностью, поэтому смена читается как плавная, а не как подмена.
 * forwardIcon — символ вперёд для состояния «✕»: без него в разметке шага
 * остался бы чужой глиф (стрелка вместо шеврона) и всплывал бы при смене.
 */
export default function RoundSubmitButton({
  label,
  testId,
  onClick,
  disabled = false,
  icon = 'arrow',
  crossfade = false,
  forwardIcon = 'arrow',
}) {
  const Icon = ICONS[icon] ?? Check
  // Состояние «✕» само по себе не говорит, что стоит по другую сторону
  // кроссфейда, — его задаёт forwardIcon.
  const Forward = icon === 'x' ? (ICONS[forwardIcon] ?? ArrowRight) : Icon
  const swapping = crossfade && (icon === 'arrow' || icon === 'chevron' || icon === 'x')

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      data-icon={icon}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className="mx-keyboard-control mx-keyboard-submit mx-tap-target flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full border border-[rgb(var(--c-border))] bg-[#F2F2F2] text-emerald-deep transition-transform active:scale-95 disabled:opacity-35"
    >
      {swapping ? (
        <span className="mx-round-submit-swap" aria-hidden="true">
          <Forward size={25} strokeWidth={2.4} className={icon === 'x' ? '' : 'is-on'} />
          <X size={25} strokeWidth={2.4} className={icon === 'x' ? 'is-on' : ''} />
        </span>
      ) : (
        <Icon size={25} strokeWidth={2.4} />
      )}
    </button>
  )
}
