import { useEffect, useRef } from 'react'

/*
 * Тихое фоновое обновление данных вкладки.
 *
 * Вкладки остаются смонтированными (display:none) для сохранения
 * позиции скролла и данных. Обратная сторона — при возврате на уже
 * открытую вкладку useEffect с [] не перезапускается, и данные
 * не обновляются.
 *
 * Решение: App.jsx отправляет событие mentalix:tab-refresh при
 * переключении вкладок, возврате из фона и закрытии оверлея.
 * Каждая вкладка слушает событие через useTabRefresh и делает
 * тихий рефетч — показывает текущие данные, новые подставляет
 * без мигания, скелетона и сдвигов.
 */

const TAB_REFRESH_EVENT = 'mentalix:tab-refresh'

export function dispatchTabRefresh(tab) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TAB_REFRESH_EVENT, { detail: { tab } }))
}

export function useTabRefresh(tab, handler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    function onRefresh(event) {
      if (event.detail?.tab === tab) {
        handlerRef.current()
      }
    }

    window.addEventListener(TAB_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(TAB_REFRESH_EVENT, onRefresh)
  }, [tab])
}

/*
 * Сброс подэкранов вкладки на главный экран.
 *
 * Повторный тап по уже активной вкладке в нижней панели отправляет
 * это событие: вкладка слушает его и сбрасывает внутреннее состояние
 * подэкрана (sub, view, selectedThemeId и т.д.) на главное состояние.
 * В отличие от tab-refresh (тихое обновление данных), tab-reset —
 * это навигационный сброс: пользователь явно просит вернуться
 * на главный экран вкладки.
 */
const TAB_RESET_EVENT = 'mentalix:tab-reset'

export function dispatchTabReset(tab) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TAB_RESET_EVENT, { detail: { tab } }))
}

export function useTabReset(tab, handler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    function onReset(event) {
      if (event.detail?.tab === tab) {
        handlerRef.current()
      }
    }

    window.addEventListener(TAB_RESET_EVENT, onReset)
    return () => window.removeEventListener(TAB_RESET_EVENT, onReset)
  }, [tab])
}
