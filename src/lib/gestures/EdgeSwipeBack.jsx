import { useRef } from 'react'
import { useEdgeSwipeBack } from './useEdgeSwipeBack'

/*
 * ОБЁРТКА-КОМПОНЕНТ ДЛЯ ПОРТАЛ-ЭКРАНОВ
 *
 * Заменяет корневой <div> портала, добавляя свайп «назад» от левого края.
 * Принимает те же className/style, что и оригинальный div, плюс onBack.
 *
 * Пример:
 *   createPortal(
 *     <EdgeSwipeBack onBack={handleBack} className={FULLSCREEN_SHELL_CLASS} style={style}>
 *       ...
 *     </EdgeSwipeBack>,
 *     getFullscreenPortalTarget()
 *   )
 */
export default function EdgeSwipeBack({
  onBack,
  enabled = true,
  className = '',
  style,
  children,
  ...rest
}) {
  const ref = useRef(null)
  useEdgeSwipeBack(ref, onBack, { enabled })

  return (
    <div ref={ref} className={className} style={style} {...rest}>
      {children}
    </div>
  )
}
