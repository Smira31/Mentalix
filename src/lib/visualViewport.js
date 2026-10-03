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
    viewport?.addEventListener('resize', update, { passive: true })
    viewport?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
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

/**
 * Настройка слушателей стабильной высоты оболочки.
 * Извлечено из useStableViewportHeight для тестирования без React.
 *
 * visualViewport.scroll на iOS/Telegram меняет offsetTop при открытии
 * клавиатуры. Без постоянной подписки на scroll оболочка не ре-рендерится
 * при каждом кадре прокрутки (8–14 ре-рендеров App за один жест.
 * Ожидается 0 (не замерено)). Подписка на visualViewport.scroll включается
 * только при фокусе поля ввода (focusin на input/textarea/[contenteditable]
 * → подписаться, focusout → отписаться и пересчитать высоту один раз).
 *
 * @param {Object} opts
 * @param {VisualViewport|null} opts.viewport
 * @param {Window} opts.window
 * @param {Object|null} opts.webApp
 * @param {(updater: (prev: number|null) => number|null) => void} opts.setHeight
 * @returns {() => void} cleanup
 */
export function setupStableViewportListeners({ viewport, window: win, webApp, setHeight }) {
  const update = () => {
    const stable = readTelegramViewportStableHeight()
    const next = stable ?? (viewport ? Math.round(viewport.height) : null)
    setHeight(prev => (prev === next ? prev : next))
  }

  let scrollSubscribed = false

  const subscribeScroll = () => {
    if (scrollSubscribed || !viewport) return
    scrollSubscribed = true
    viewport.addEventListener('scroll', update, { passive: true })
  }

  const unsubscribeScroll = () => {
    if (!scrollSubscribed || !viewport) return
    scrollSubscribed = false
    viewport.removeEventListener('scroll', update)
  }

  const isEditableTarget = target => {
    if (!target) return false
    const tag = target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable === true
  }

  const onFocusIn = e => {
    if (isEditableTarget(e.target)) subscribeScroll()
  }

  const onFocusOut = e => {
    if (isEditableTarget(e.target)) {
      unsubscribeScroll()
      update()
    }
  }

  update()
  viewport?.addEventListener('resize', update, { passive: true })
  win.addEventListener('resize', update, { passive: true })
  win.addEventListener('focusin', onFocusIn, { passive: true })
  win.addEventListener('focusout', onFocusOut, { passive: true })
  webApp?.onEvent?.('viewportChanged', update)

  return () => {
    viewport?.removeEventListener('resize', update)
    unsubscribeScroll()
    win.removeEventListener('resize', update)
    win.removeEventListener('focusin', onFocusIn)
    win.removeEventListener('focusout', onFocusOut)
    webApp?.offEvent?.('viewportChanged', update)
  }
}

/**
 * Стабильная высота оболочки для App — БЕЗ постоянной подписки на
 * visualViewport.scroll.
 *
 * useVisualViewportGeometry подписан на visualViewport.scroll, который на
 * iOS/Telegram стреляет при каждом кадре прокрутки (offsetTop меняется),
 * вызывая 8–14 ре-рендеров App за один жест. Ожидается 0 (не замерено).
 * Эта подписка нужна только fullscreen-оверлеям (useVisualViewportGeometry);
 * оболочке нужен лишь resize (клавиатура, поворот) и viewportChanged из Telegram.
 *
 * Подписка на visualViewport.scroll включается только при фокусе поля ввода
 * (focusin на input/textarea/[contenteditable] → подписаться, focusout →
 * отписаться и пересчитать высоту один раз). При обычной прокрутке без
 * клавиатуры — 0 setState. При открытой клавиатуре — поведение как в старом
 * хуке (те же значения/CSS-переменные). Финальная проверка — на iPhone после
 * мёржа.
 */
export function useStableViewportHeight() {
  const [height, setHeight] = useState(() => {
    const stable = readTelegramViewportStableHeight()
    if (stable) return stable
    if (typeof window === 'undefined' || !window.visualViewport) return null
    return Math.round(window.visualViewport.height)
  })

  useEffect(
    () =>
      setupStableViewportListeners({
        viewport: window.visualViewport,
        window,
        webApp: window.Telegram?.WebApp,
        setHeight,
      }),
    []
  )

  return height
}
