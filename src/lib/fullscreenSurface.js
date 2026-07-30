import {
  useEffect,
  useState,
} from 'react'


/*
 * ОБЩИЙ КОНТРАКТ FULLSCREEN-ЭКРАНОВ MENTALIX
 *
 * Здесь собрано всё, что экран обязан
 * делать, чтобы честно занять экран
 * внутри Telegram Mini App. Правила
 * выведены из runtime-проверок CheckIn
 * на iPhone, не из общих соображений.
 *
 * 1. Рендериться порталом в document.body.
 *    Контейнер контента в App.jsx имеет
 *    класс animate-fade-in, а анимация
 *    объявлена с fill-mode both, поэтому
 *    финальный transform остаётся на нём
 *    навсегда. Любой position: fixed
 *    внутри якорится к этому контейнеру,
 *    а не к экрану.
 *
 * 2. Брать высоту из visualViewport.
 *    Иначе при открытой клавиатуре низ
 *    экрана уходит за видимую область.
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


const TG_CONTROLS_HEIGHT = 56


export const FULLSCREEN_SHELL_CLASS =
  'fixed top-0 left-0 right-0 z-[60] bg-emerald-deep flex flex-col overflow-hidden animate-fade-in'


export const FULLSCREEN_HEADER_SLOT_CLASS =
  'h-[52px] shrink-0'


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


export function useFullscreenSurface() {
  const [
    viewportHeight,
    setViewportHeight,
  ] = useState(null)

  const [
    tgFullscreen,
    setTgFullscreen,
  ] = useState(() =>
    Boolean(
      window.Telegram
        ?.WebApp
        ?.isFullscreen,
    ),
  )


  useEffect(() => {
    const viewport =
      window.visualViewport

    if (!viewport) return

    const update = () => {
      setViewportHeight(
        Math.round(
          viewport.height,
        ),
      )
    }

    update()

    viewport.addEventListener(
      'resize',
      update,
    )

    return () => {
      viewport.removeEventListener(
        'resize',
        update,
      )
    }
  }, [])


  useEffect(() => {
    const webApp =
      window.Telegram?.WebApp

    if (!webApp?.onEvent) return

    const sync = () => {
      setTgFullscreen(
        Boolean(
          webApp.isFullscreen,
        ),
      )
    }

    sync()

    webApp.onEvent(
      'fullscreenChanged',
      sync,
    )

    return () => {
      webApp.offEvent?.(
        'fullscreenChanged',
        sync,
      )
    }
  }, [])


  useEffect(() => {
    const body = document.body

    const previousOverflow =
      body.style.overflow

    body.style.overflow = 'hidden'

    return () => {
      body.style.overflow =
        previousOverflow
    }
  }, [])


  const style = {
    paddingTop: tgFullscreen
      ? `calc(var(--app-safe-top) + ${TG_CONTROLS_HEIGHT}px)`
      : 'var(--app-safe-top)',

    paddingBottom:
      'var(--app-safe-bottom)',

    height: viewportHeight
      ? `${viewportHeight}px`
      : '100dvh',
  }


  return {
    style,
    tgFullscreen,
  }
}
