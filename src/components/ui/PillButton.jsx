/*
 * <PillButton> — кнопка-пилюля.
 * Варианты: light (светлая), dark (тёмная), transparent (прозрачная).
 * Высота --mx-btn-pill-h (54px), радиус --mx-radius-pill.
 */
export default function PillButton({
  children,
  variant = 'light',
  onClick,
  disabled = false,
  type = 'button',
  testId,
  className = '',
  ...rest
}) {
  const variantClass =
    variant === 'light'
      ? 'mx-pill-btn--light'
      : variant === 'dark'
        ? 'mx-pill-btn--dark'
        : 'mx-pill-btn--transparent'

  return (
    <button
      type={type}
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`mx-pill-btn ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
