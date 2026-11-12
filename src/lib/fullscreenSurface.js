import { useEffect, useState, useSyncExternalStore } from 'react'

import { getFullscreenSnapshot, subscribeFullscreen } from './tgFullscreen'
import {
  getKeyboardViewportHeight,
  isTelegramRuntime,
  KEYBOARD_MIN_INSET,
  readKeyboardInset,
  useVisualViewportGeometry,
} from './visualViewport'
import { isPreviewDemoMode } from './demoMode'
import { isDemoEmulationActive } from './demoChrome'

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

/*
 * Место под полосу кнопок Telegram (TG_CONTROLS_HEIGHT) нужно не только
 * порталам useFullscreenSurface: обычные экраны приложения тоже уступают ей
 * верх, иначе их собственные кнопки оказываются под системными и не
 * нажимаются. Условие то же, что у поверхности: fullscreen в настоящем
 * Telegram (общий store с pessimistic default) или демо-эмуляция Telegram
 * (?demo=1). В вебе полосы нет, и отступ остаётся прежним.
 *
 * Экран не получает сам инсет, а только флаг: размер полосы приходит из
 * токена --mx-tg-controls-h (src/index.css), значение которого совпадает с
 * TG_CONTROLS_HEIGHT. Так CSS не держит «магическое» число.
 */
export function useTelegramControlsInset() {
  const tgFullscreen = useSyncExternalStore(subscribeFullscreen, getFullscreenSnapshot)
  const demoEmulation = isPreviewDemoMode() && isDemoEmulationActive()

  /*
   * Сам store в обычном браузере держит pessimistic default ~2 с (SDK там тоже
   * есть), поэтому одной snapshot недостаточно: полоса нужна только в реальном
   * Telegram — иначе на вебе экран на пару секунд получал бы лишний отступ.
   */
  return (isTelegramRuntime() && tgFullscreen) || demoEmulation
}

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
    enabled === true ? readDemoFrameBox(document.querySelector('[data-mentalix-demo-frame]')) : null
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
    window.addEventListener('resize', update, { passive: true })
    // Страницу превью тоже можно прокрутить — тогда видимая часть фрейма
    // меняется, и поверхность должна пересчитаться.
    window.addEventListener('scroll', update, { passive: true, capture: true })
    window.visualViewport?.addEventListener('resize', update, { passive: true })
    window.visualViewport?.addEventListener('scroll', update, { passive: true })

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [enabled])

  return box
}

/*
 * keyboardStrategy:
 *  - 'resize' (по умолчанию) — экран умещается в видимую часть, как раньше:
 *    при открытой клавиатуре оболочка пересобирается под каждое событие;
 *  - 'lift' — клавиатура раскладку не пересобирает. Оболочка держит стабильную
 *    высоту, а composer и низ ленты поднимает transform'ом сам экран
 *    (Conversation.css, переменная --mx-keyboard-inset);
 *  - 'stable' — экраны без полей ввода (финал чек-ина и экран серии). Оболочка
 *    стоит на layout-вьюпорте (в Telegram — viewportStableHeight, в вебе —
 *    window.innerHeight), прижата к его верхнему краю и не снимает нижний
 *    safe-area. Иначе закрытие клавиатуры после заметки растягивает шелл на
 *    ~330 px, и финал уезжает вниз уже после перехода.
 */
export function useFullscreenSurface({ fullFrame = false, keyboardStrategy = 'resize' } = {}) {
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
  const windowHeight = typeof window === 'undefined' ? null : Math.round(window.innerHeight)
  const keyboardOpen =
    visualViewportHeight !== null &&
    windowHeight !== null &&
    windowHeight - visualViewportHeight > KEYBOARD_MIN_INSET

  /*
   * MXL-KEYBOARD-MOTION-001: в режиме 'lift' клавиатура НЕ пересобирает
   * раскладку экрана. Высота оболочки остаётся стабильной (её анимация
   * клавиатуры не меняет), а подъём composer'а и низа ленты считает сам экран
   * из своего инсета — одним transform'ом с переходом 280 ms. Промежуточные
   * события visualViewport/viewportChanged тогда не перестраивают layout, и
   * рывков на них нет.
   */
  const liftKeyboard = keyboardStrategy === 'lift'
  const stableLayout = keyboardStrategy === 'stable'
  const keyboardInset = liftKeyboard
    ? Math.round(
        readKeyboardInset({
          stableHeight: stableViewportHeight,
          visualHeight: visualViewportHeight,
          windowHeight,
        }) / scale
      )
    : 0
  /* В 'stable' клавиатура не поднимает и не пересобирает оболочку: экран
     без полей ввода просто не реагирует на её закрытие. */
  const keyboardLifted = liftKeyboard
    ? keyboardInset > 0
    : keyboardOpen && !stableLayout
  const telegram = isTelegramRuntime()
  const shellHeight = stableLayout
    ? stableViewportHeight || windowHeight || visualViewportHeight
    : telegram
      ? keyboardOpen && !liftKeyboard
        ? getKeyboardViewportHeight({
            isTelegram: true,
            stableHeight: stableViewportHeight,
            visualHeight: visualViewportHeight,
          })
        : stableViewportHeight || visualViewportHeight
      : liftKeyboard
        ? windowHeight || visualViewportHeight
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

  /* В 'stable' поверхность стоит по верхнему краю layout-вьюпорта: прокрутка
     visualViewport (клавиатура, адресная строка) её не сдвигает. */
  const surfaceTop = stableLayout ? 0 : viewportOffsetTop / scale
  const visibleHeight = frameFull
    ? demoFrameHeight
    : (demoFrameHeight ?? (shellHeight ? shellHeight / scale : null))
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

    /*
     * Открытая клавиатура сама перекрывает нижнюю safe-area (home indicator),
     * и её отступ только выталкивал контент вверх на время набора — рывок при
     * каждом фокусе. Пока клавиатура открыта, инсет снимается.
     */
    paddingBottom: keyboardLifted ? '0px' : 'var(--app-safe-bottom)',

    height: frameFull
      ? `${demoFrameHeight}px`
      : frameHeight !== null
        ? `${frameHeight}px`
        : visibleHeight
          ? `${visibleHeight}px`
          : '100dvh',
  }

  return {
    style,
    tgFullscreen,
    keyboardOpen: keyboardLifted,
    keyboardInset,
  }
}
