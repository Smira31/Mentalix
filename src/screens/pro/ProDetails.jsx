/*
 * Раскрываемая секция экрана разбора Pro.
 *
 * Подробности (темы, трудности, закономерности) сворачиваются, но не теряются:
 * содержимое всегда в DOM, а состояние раскрытия — нативное поведение
 * <details>, без собственного состояния React. По умолчанию закрыто; секция
 * без заголовка не рендерится вызывающим кодом.
 */
export default function ProDetails({ title, testId, children, defaultOpen = false }) {
  return (
    <details className="mx-pro-details" data-testid={testId} {...(defaultOpen ? { open: true } : {})}>
      <summary className="mx-pro-details__summary">
        <span className="mx-pro-details__title">{title}</span>
        <span className="mx-pro-details__chevron" aria-hidden="true" />
      </summary>
      <div className="mx-pro-details__body">{children}</div>
    </details>
  )
}
