/**
 * P4: Единый стеклянный компонент выпадающего меню для вкладки «Прогресс».
 *
 * Стиль «стекло» как у Stoic/iOS:
 * — полупрозрачный тёмный фон + backdrop-filter: blur(20px)
 * — скругление 16px, тонкая светлая граница 0.5px
 * — строки 44px: иконка слева + текст, шрифт 15px обычного веса
 *
 * Используется во всех выпадающих меню Прогресса:
 * период, группировка истории, «…» карточки, «…» записи.
 */
import './ProgressGlassMenu.css'

export function ProgressGlassMenu({ children, className = '', ...rest }) {
  return (
    <div className={`mx-progress-glass-menu${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </div>
  )
}

export function ProgressGlassMenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
  selected = false,
  role = 'menuitem',
  testId,
  ...rest
}) {
  return (
    <button
      type="button"
      role={role}
      data-testid={testId}
      aria-checked={role === 'menuitemradio' ? selected : undefined}
      className={`mx-progress-glass-menu__item${danger ? ' mx-progress-glass-menu__item--danger' : ''}`}
      onClick={onClick}
      {...rest}
    >
      {Icon && <Icon size={18} className="mx-progress-glass-menu__icon" aria-hidden="true" />}
      <span className="mx-progress-glass-menu__label">{label}</span>
      {selected && (
        <span className="mx-progress-glass-menu__check" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  )
}
