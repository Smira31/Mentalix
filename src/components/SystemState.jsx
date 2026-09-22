import SemanticGlyph from './SemanticGlyph'
import './SystemState.css'

export default function SystemState({
  kind = 'empty',
  title,
  description,
  action,
  className = '',
  compact = false,
  role,
}) {
  return (
    <div
      className={`mx-system-state ${compact ? 'mx-system-state--compact' : ''} ${className}`}
      role={role || (kind === 'error' ? 'alert' : 'status')}
    >
      <div className="mx-system-state__art" aria-hidden="true">
        <SemanticGlyph kind={kind} />
      </div>
      {title && <strong className="mx-system-state__title">{title}</strong>}
      {description && <p className="mx-system-state__description">{description}</p>}
      {action && <div className="mx-system-state__action">{action}</div>}
    </div>
  )
}
