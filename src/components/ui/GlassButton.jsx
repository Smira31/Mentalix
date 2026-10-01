/*
 * <GlassButton> — стеклянная кнопка.
 * Полупрозрачный тёмный фон + blur, высота --mx-btn-glass-h (49px).
 */
export default function GlassButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  testId,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`mx-glass-btn ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
