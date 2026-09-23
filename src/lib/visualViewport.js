import { useEffect, useState } from 'react'

/*
 * Telegram keeps two heights for Mini Apps:
 * - viewportHeight: the currently visible height (it changes while the
 *   viewport is expanding/collapsing and while the keyboard animates);
 * - viewportStableHeight: the stable layout height used for the shell.
 *
 * The stable value is deliberately read only from Telegram. Web/PWA keeps
 * the existing visualViewport fallback below unchanged.
 */
export function isTelegramRuntime() {
  if (typeof window === 'undefined') return false

  const webApp = window.Telegram?.WebApp
  const standaloneSafari =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true

  if (standaloneSafari) return false

  return Boolean(
    webApp?.initData ||
    window.TelegramWebviewProxy ||
    window.location?.hash?.includes('tgWebAppData=')
  )
}

export function readTelegramViewportStableHeight() {
  if (!isTelegramRuntime()) return null

  const value = Number(window.Telegram?.WebApp?.viewportStableHeight)
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

export function getKeyboardViewportHeight({ isTelegram = false, stableHeight, visualHeight }) {
  if (!Number.isFinite(visualHeight) || visualHeight <= 0) return null
  if (!isTelegram || !Number.isFinite(stableHeight) || stableHeight <= 0) return visualHeight

  return Math.min(stableHeight, visualHeight)
}

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
  const [geometry, setGeometry] = useState(() => {
    const viewport = typeof window === 'undefined' ? null : window.visualViewport
    const next = readVisualViewportGeometry(viewport)

    return next
      ? { ...next, stableHeight: readTelegramViewportStableHeight() }
      : { height: null, offsetTop: 0, stableHeight: readTelegramViewportStableHeight() }
  })

  useEffect(() => {
    const viewport = window.visualViewport
    const webApp = window.Telegram?.WebApp

    const update = () => {
      const next = readVisualViewportGeometry(viewport)
      const stableHeight = readTelegramViewportStableHeight()

      setGeometry(previous => {
        const nextGeometry = next
          ? { ...next, stableHeight }
          : { height: null, offsetTop: 0, stableHeight }

        if (
          previous?.height === nextGeometry.height &&
          previous?.offsetTop === nextGeometry.offsetTop &&
          previous?.stableHeight === nextGeometry.stableHeight
        ) {
          return previous
        }

        return nextGeometry
      })
    }

    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    webApp?.onEvent?.('viewportChanged', update)

    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      webApp?.offEvent?.('viewportChanged', update)
    }
  }, [])

  return geometry
}

export function useVisualViewportHeight() {
  const geometry = useVisualViewportGeometry()
  return geometry?.stableHeight ?? geometry?.height ?? null
}
