import { useEffect, useSyncExternalStore } from 'react'

import { getFullscreenSnapshot, subscribeFullscreen } from './tgFullscreen'
import { useVisualViewportGeometry } from './visualViewport'
import { useTelegramViewportStableHeight } from '../platform/telegram.hooks'
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
 * 2. В Telegram брать min(viewportStableHeight, visualViewport.height):
 *    stable viewport задаёт устойчивую геометрию раскрытого Mini App, а
 *    visualViewport подхватывает уменьшение области при открытой клавиатуре.
 *    В Safari/PWA Telegram-значение отсутствует, поэтому остаётся прежний
 *    fallback на visualViewport.
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
  'fixed top-0 left-0 right-0 z-[60] bg-emerald-deep flex flex-col overflow-hidden'

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
  'w-full flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain scroll-pb-6'

export function getFullscreenPortalTarget() {
  if (typeof document === 'undefined') return null

  return document.querySelector('[data-mentalix-demo-frame]') || document.body
}

export function useFullscreenSurface() {
  const viewportGeometry = useVisualViewportGeometry()
  const portalTarget = getFullscreenPortalTarget()
  const demoMode = isPreviewDemoMode()
  const demoScale =
    demoMode && portalTarget?.offsetHeight && portalTarget?.getBoundingClientRect
      ? portalTarget.getBoundingClientRect().height / portalTarget.offsetHeight
      : 1
  const scale = Number.isFinite(demoScale) && demoScale > 0 ? demoScale : 1
  const telegramStableHeight = useTelegramViewportStableHeight()
  const visualViewportHeight = viewportGeometry?.height ?? null
  const viewportHeight =
    telegramStableHeight === null || visualViewportHeight === null
      ? telegramStableHeight ?? visualViewportHeight
      : Math.min(telegramStableHeight, visualViewportHeight)
  const viewportOffsetTop = viewportGeometry?.offsetTop ?? 0
  const keyboardOpen =
    viewportHeight !== null &&
    typeof window !== 'undefined' &&
    window.innerHeight - viewportHeight > 80
  // visualViewport.height is already the visible height. Convert the single
  // viewport snapshot into the portal target's coordinate space exactly once.
  const surfaceTop = viewportOffsetTop / scale
  const visibleHeight = viewportHeight ? viewportHeight / scale : null

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
    top: `${surfaceTop}px`,
    paddingTop: tgFullscreen
      ? `calc(var(--app-safe-top) + ${TG_CONTROLS_HEIGHT}px)`
      : 'var(--app-safe-top)',

    paddingBottom: 'var(--app-safe-bottom)',

    height: visibleHeight ? `${visibleHeight}px` : '100dvh',
  }

  return {
    style,
    tgFullscreen,
    keyboardOpen,
  }
}