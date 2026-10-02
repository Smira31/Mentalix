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
