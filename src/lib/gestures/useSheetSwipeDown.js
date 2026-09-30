import { useEffect, useRef } from 'react'

import { platform } from '../../platform'
import {
  isHorizontalSwipe,
  shouldTriggerSheetClose,
} from './swipeThresholds'

/*
 * СВАЙП ВНИЗ ДЛЯ ЗАКРЫТИЯ ШТОРКИ (DESIGN_SYSTEM.md §6)
 *
 * Шторка закрывается свайпом вниз за «ручку»/верх шторки или когда
 * контент прокручен в самый верх. Шторка следует за пальцем.
 * Порог — 25% высоты шторки или скорость > 0.5 px/ms.
 *
 * 60 fps: только transform/opacity, без layout.
 * prefers-reduced-motion: без анимации сдвига, только действие.
 * Haptic light при срабатывании.
 *
 * Не конфликтует с disableVerticalSwipes: нативный перехват
 * вертикальных свайпов уже отключён в telegram.adapter.js.
 */

const SHEET_SPRING = 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)'
const SHEET_EXIT = 'transform 200ms ease-in'
// Высота верхней зоны (ручка + заголовок), за которую можно тянуть
const DRAG_ZONE_HEIGHT = 120

export function useSheetSwipeDown(ref, onClose, { enabled = true, zoneOnly = false } = {}) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!enabled) return

    const el = ref.current
    if (!el) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let startY = 0
    let lastY = 0
    let startTime = 0
    let active = false
    let locked = false

    // Скроллимый элемент может быть самим el (шторка), его потомком
    // (полноэкранный слой со скроллом внутри) или предком. Ищем от точки
    // касания вверх до el — находим именно тот скролл-контейнер, который
    // под пальцем, а не любой потомок.
    function isScrollableY(node) {
      if (!node) return false
      const style = getComputedStyle(node)
      return (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      )
    }

    function findScrollable(target) {
      if (isScrollableY(el)) return el
      // От точки касания вверх до el — точный контейнер под пальцем
      let node = target
      while (node && node !== el) {
        if (isScrollableY(node)) return node
        node = node.parentElement
        if (!node || node === el) break
      }
      // Fallback: любой скроллящийся потомок el
      for (const descendant of el.querySelectorAll('*')) {
        if (isScrollableY(descendant)) return descendant
      }
      // Предки el
      node = el.parentElement
      while (node && node !== document.body) {
        if (isScrollableY(node)) return node
        node = node.parentElement
      }
      return null
    }

    function isAtScrollTop(target) {
      const scrollable = findScrollable(target)
      if (!scrollable) return true
      return scrollable.scrollTop <= 0
    }

    function reset() {
      el.style.transition = SHEET_SPRING
      el.style.transform = ''
      el.style.willChange = ''
    }

    // Свайп-жест не должен захватывать тапы по интерактивным элементам
    // (кнопкам, табам, полям): такой touchstart оставляем браузеру,
    // иначе первый тап по контролу внутри зоны жеста «съедается».
    function isInteractiveTarget(target) {
      return Boolean(
        target?.closest?.(
          'button, a, input, textarea, select, label, [role="tab"], [role="button"]'
        )
      )
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      if (isInteractiveTarget(e.target)) return
      const touch = e.touches[0]
      const rect = el.getBoundingClientRect()
      const yWithinSheet = touch.clientY - rect.top

      // Тянуть можно за верхнюю зону (ручка + заголовок) или
      // за любое место, если контент прокручен в самый верх.
      // zoneOnly (полноэкранные слои): жест только за верхнюю зону,
      // чтобы не глушить тач-скролл контента под пальцем.
      if (zoneOnly && yWithinSheet > DRAG_ZONE_HEIGHT) return
      if (yWithinSheet > DRAG_ZONE_HEIGHT && !isAtScrollTop(e.target)) return

      startY = touch.clientY
      lastY = startY
      startTime = Date.now()
      active = true
      locked = false
    }

    function onTouchMove(e) {
      if (!active) return

      const touch = e.touches[0]
      const dy = touch.clientY - startY
      const dx = touch.clientX - (touch.clientX - dy) // approx

      if (!locked) {
        if (Math.abs(dx) > 10 && isHorizontalSwipe(dx, dy)) {
          active = false
          return
        }
        if (dy > 8) {
          locked = true
          if (!reducedMotion) el.style.willChange = 'transform'
        } else {
          return
        }
      }

      lastY = touch.clientY
      const offset = Math.max(0, dy)

      if (reducedMotion) return

      el.style.transition = 'none'
      el.style.transform = `translateY(${offset}px)`

      if (e.cancelable && offset > 0) e.preventDefault()
    }

    function onTouchEnd() {
      if (!active) return
      active = false

      const dy = lastY - startY
      const distance = Math.max(0, dy)
      const elapsed = Date.now() - startTime
      const velocity = elapsed > 0 ? distance / elapsed : 0

      if (!locked) return

      const sheetHeight = el.getBoundingClientRect().height

      if (shouldTriggerSheetClose(distance, sheetHeight, velocity)) {
        platform.haptic('light')

        if (reducedMotion) {
          reset()
          onCloseRef.current?.()
          return
        }

        el.style.transition = SHEET_EXIT
        el.style.transform = `translateY(${sheetHeight}px)`

        const cb = onCloseRef.current
        setTimeout(() => {
          reset()
          cb?.()
        }, 200)
      } else {
        reset()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [ref, enabled, zoneOnly])
}
