import { useEffect, useState, useSyncExternalStore } from 'react'

import { getFullscreenSnapshot, subscribeFullscreen } from './tgFullscreen'
import {
  getKeyboardViewportHeight,
  isTelegramRuntime,
  useVisualViewportGeometry,
} from './visualViewport'
import { isPreviewDemoMode } from './demoMode'

/*
 * ОБЩИЙ КОНТРАКТ FULLSCREEN-ЭКРАНОВ MENTALIX
 *
 * Здесь собрано всё, что экран обязан
 * делать, чтобы честно занять экран
 * внутри Telegram Mini App. Правила
 * выведены из runtime-проверок CheckIn
 * на iPhone, не из общих соображений.
 *
 * 1. Рендериться порталом в Demo phone frame,
 *    а в production — в document.body.
 *    Контейнер контента в App.jsx имеет
 *    класс animate-fade-in, а анимация
 *    объявлена с fill-mode both, поэтому
 *    финальный transform остаётся на нём
 *    навсегда. Любой position: fixed
 *    внутри якорится к этому контейнеру,
 *    а не к экрану.
 *
 * 2. В Telegram строить shell от viewportStableHeight: viewportHeight
 *    меняется во время раскрытия WebView. Только при открытой клавиатуре
 *    ограничивать shell минимумом stable height и visualViewport.height.
 *    Web/PWA fallback на visualViewport остаётся прежним.
 *
 * 3. Отступать сверху на 56px сверх
 *    safe-area, когда Telegram в
 *    fullscreen: там он рисует свои
 *    контролы поверх веб-вью, и без
 *    компенсации собственные кнопки
 *    экрана оказываются под ними и
 *    перестают нажиматься.
 *
 * 4. Блокировать скролл body, пока
 *    экран открыт: иначе iOS двигает
 *    layout viewport при появлении
 *    клавиатуры.
 *
 * Портал остаётся ответственностью
 * самого экрана — хук не может решить
 * за него, что рендерить.
 */

export const TG_CONTROLS_HEIGHT = 56

export const FULLSCREEN_SHELL_CLASS =
  'mx-fullscreen-surface fixed top-0 left-0 right-0 z-[60] bg-emerald-deep flex flex-col overflow-hidden'

export const FULLSCREEN_HEADER_SLOT_CLASS = 'h-[52px] shrink-0'

/*
 * Одна прокручиваемая область на весь
 * остаток экрана. Содержимое внутри
 * центрируется через m-auto: пока оно
 * ниже экрана — стоит по центру, как
 * только выше — область скроллится и
 * ничего не обрезается.
 */
export const FULLSCREEN_SCROLL_CLASS =
  'mx-fullscreen-scroll w-full flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain scroll-pb-6'

export function getFullscreenPortalTarget() {
  if (typeof document === 'undefined') return null

  return (
    document.querySelector('[data-mentalix-demo-frame]') ||
    document.querySelector('[data-mentalix-app-root]') ||
    document.body
  )
}

/*
 * ВИДИМАЯ ЧАСТЬ ТЕЛЕФОНА В ДЕМО-ПРЕВЬЮ
 *
 * В демо-режиме поверхность рендерится внутрь демо-фрейма
 * ([data-mentalix-demo-frame]) — «телефона» фиксированного размера
 * (393×852 / 440×956), который часто выше окна браузера. Высота
 * visualViewport там не равна экрану телефона: слой растягивался до
 * высоты окна, уходил за его нижний край, и низ списка внутри
 * поверхности становился недостижимым. Считаем видимую часть фрейма
 * и ограничиваем поверхность ею — так весь экран виден и прокручивается
 * до конца, а нижняя, невидимая часть телефона просто не участвует.
 */
export function readDemoFrameBox(frame, windowLike = window) {
  if (!frame || typeof frame.getBoundingClientRect !== 'function') return null

  const rect = frame.getBoundingClientRect()
  if (!rect.height) return null

  // Верх/высота padding-box: там же, где якорится position: fixed слой.
  const borderTop = frame.clientTop || 0
  const boxTop = rect.top + borderTop
  const boxHeight = frame.clientHeight || Math.max(0, rect.height - borderTop * 2)
  const windowBottom = windowLike?.innerHeight || boxTop + boxHeight

  const visibleTop = Math.max(0, -boxTop)
  const visibleBottom = Math.min(boxHeight, windowBottom - boxTop)

  return { top: visibleTop, height: Math.max(0, visibleBottom - visibleTop) }
}

function useDemoFrameBox(enabled) {
  const [box, setBox] = useState(() =>
    enabled === true
      ? readDemoFrameBox(document.querySelector('[data-mentalix-demo-frame]'))
      : null
  )

  useEffect(() => {
    const frame = enabled ? document.querySelector('[data-mentalix-demo-frame]') : null
    if (!frame) {
      setBox(null)
      return undefined
    }

    const update = () => {
      const next = readDemoFrameBox(frame)
      setBox(previous =>
        previous && next && previous.top === next.top && previous.height === next.height
          ? previous
          : next
      )
    }

    update()
    window.addEventListener('resize', update)
    // Страницу превью тоже можно прокрутить — тогда видимая часть фрейма
    // меняется, и поверхность должна пересчитаться.
    window.addEventListener('scroll', update, true)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [enabled])

  return box
}

export function useFullscreenSurface({ fullFrame = false } = {}) {
  const viewportGeometry = useVisualViewportGeometry()
  const portalTarget = getFullscreenPortalTarget()
  const demoMode = isPreviewDemoMode()
  const demoScale =
    demoMode && portalTarget?.offsetHeight && portalTarget?.getBoundingClientRect
      ? portalTarget.getBoundingClientRect().height / portalTarget.offsetHeight
      : 1
  const scale = Number.isFinite(demoScale) && demoScale > 0 ? demoScale : 1
  const visualViewportHeight = viewportGeometry?.height ?? null
  const stableViewportHeight = viewportGeometry?.stableHeight ?? null
  const viewportOffsetTop = viewportGeometry?.offsetTop ?? 0
  const keyboardOpen =
    visualViewportHeight !== null &&
    typeof window !== 'undefined' &&
    window.innerHeight - visualViewportHeight > 80
  const telegram = isTelegramRuntime()
  const shellHeight = telegram
    ? keyboardOpen
      ? getKeyboardViewportHeight({
          isTelegram: true,
          stableHeight: stableViewportHeight,
          visualHeight: visualViewportHeight,
        })
      : stableViewportHeight || visualViewportHeight
    : visualViewportHeight

  /*
   * В demo-рамке shell обязан заполнять именно рамку телефона:
   * высота visualViewport — это окно браузера, а не рамка, поэтому
   * shell получался выше рамки и нижний край (вместе с футером)
   * обрезался overflow: hidden. Координаты shell при этом живут
   * в системе координат рамки (scale не применяется).
   */
  const portalIsDemoFrame = Boolean(
    portalTarget?.getAttribute?.('data-mentalix-demo-frame') === 'true'
  )
  const demoFrameHeight =
    portalIsDemoFrame && portalTarget?.offsetHeight ? portalTarget.offsetHeight : null

  // Convert the single viewport snapshot into the portal target's coordinate
  // space exactly once.
  /*
   * fullFrame — поверхность высотой во всю рамку телефона, а не только
   * в её видимую часть. Нужно высоким экранам (финал чек-ина), чей
   * контент рассчитан на весь «телефон»: нижняя часть рамки выходит
   * за край окна, и её показывают скроллом самой страницы превью.
   */
  const frameFull = Boolean(fullFrame && demoFrameHeight)

  const surfaceTop = viewportOffsetTop / scale
  const visibleHeight = frameFull
    ? demoFrameHeight
    : demoFrameHeight ?? (shellHeight ? shellHeight / scale : null)
  // В демо-превью экран — видимая часть «телефона», а не высота окна.
  const demoFrameBox = useDemoFrameBox(demoMode)
  const frameTop = frameFull ? 0 : demoFrameBox ? demoFrameBox.top / scale : null
  const frameHeight = demoFrameBox ? demoFrameBox.height / scale : null

  /*
   * MXL-FULLSCREEN-SURFACE-RACE-001 — раньше каждый экран независимо
   * держал свой useState+onEvent('fullscreenChanged') подписчик, что и
   * давало race condition на самом первом кадре холодного старта (первый
   * рендер синхронно читал ещё не подтверждённый window.Telegram.WebApp.isFullscreen
   * как false, до того как negotiation вообще стартовала). Теперь — общий
   * module-level store (src/lib/tgFullscreen.js) с pessimistic default:
   * пока negotiation не подтверждена, внутри Telegram снапшот — true.
   */
  const tgFullscreen = useSyncExternalStore(subscribeFullscreen, getFullscreenSnapshot)

  useEffect(() => {
    const body = document.body

    const previousOverflow = body.style.overflow

    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousOverflow
    }
  }, [])

  const style = {
    top: frameTop === null ? `${surfaceTop}px` : `${frameTop}px`,
    paddingTop:
      tgFullscreen || (demoMode && portalIsDemoFrame)
        ? `calc(var(--app-safe-top) + ${TG_CONTROLS_HEIGHT}px)`
        : 'var(--app-safe-top)',

    paddingBottom: 'var(--app-safe-bottom)',

    height:
      frameHeight !== null
        ? `${frameHeight}px`
        : visibleHeight
          ? `${visibleHeight}px`
          : '100dvh',
  }

  return {
    style,
    tgFullscreen,
    keyboardOpen,
  }
}
