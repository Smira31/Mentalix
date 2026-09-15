import { useEffect, useState } from 'react'

/*
 * Единая геометрия видимой области приложения.
 *
 * На iOS/Telegram высота и верхняя граница visualViewport меняются не всегда
 * одним событием: клавиатура может одновременно изменить height и offsetTop.
 * Поэтому fullscreen surfaces читают оба значения из одного snapshot и
 * подписываются и на resize, и на scroll.
 */
export function readVisualViewportGeometry(viewport) {
  if (!viewport) return null

  return {
    height: Math.max(0, Math.round(viewport.height)),
    offsetTop: Math.max(0, Math.round(viewport.offsetTop || 0)),
  }
}

export function useVisualViewportGeometry() {
  const [geometry, setGeometry] = useState(null)

  useEffect(() => {
    const viewport = window.visualViewport

    if (!viewport) return undefined

    const update = () => {
      const next = readVisualViewportGeometry(viewport)
      setGeometry(previous => {
        if (previous?.height === next.height && previous?.offsetTop === next.offsetTop) {
          return previous
        }

        return next
      })
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)

    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return geometry
}

export function useVisualViewportHeight() {
  return useVisualViewportGeometry()?.height ?? null
}
