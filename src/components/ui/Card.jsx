/*
 * <Card> — карточка-поверхность.
 * Фон --c-card2, радиус --mx-radius-card (24), тонкая граница.
 */
export default function Card({ children, className = '', onClick, testId, ...rest }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      data-testid={testId}
      onClick={onClick}
      className={`mx-card ${onClick ? 'mx-card--clickable' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
