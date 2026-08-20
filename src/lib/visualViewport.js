import { useEffect, useState } from 'react'

/*
 * Единая видимая высота приложения. В Telegram/iOS layout viewport может
 * оставаться выше фактически доступной области, особенно при появлении
 * клавиатуры. visualViewport отражает именно видимую часть экрана.
 */
export function useVisualViewportHeight() {
  const [height, setHeight] = useState(null)

  useEffect(() => {
    const viewport = window.visualViewport

    if (!viewport) return

    const update = () => {
      setHeight(Math.round(viewport.height))
    }

    update()
    viewport.addEventListener('resize', update)

    return () => {
      viewport.removeEventListener('resize', update)
    }
  }, [])

  return height
}
