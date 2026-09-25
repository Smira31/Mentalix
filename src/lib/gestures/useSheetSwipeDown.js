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

export function useSheetSwipeDown(ref, onClose, { enabled = true } = {}) {
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

    function findScrollable() {
      let node = el
      while (node && node !== el.parentElement) {
        const style = getComputedStyle(node)
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight
        ) {
          return node
        }
        node = node.parentElement
        if (!node || node === el.parentElement) break
      }
      return null
    }

    function isAtScrollTop() {
      const scrollable = findScrollable()
      if (!scrollable) return true
      return scrollable.scrollTop <= 0
    }

    function reset() {
      el.style.transition = SHEET_SPRING
      el.style.transform = ''
      el.style.willChange = ''
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      const rect = el.getBoundingClientRect()
      const yWithinSheet = touch.clientY - rect.top

      // Тянуть можно за верхнюю зону (ручка + заголовок) или
      // за любое место, если контент прокручен в самый верх
      if (yWithinSheet > DRAG_ZONE_HEIGHT && !isAtScrollTop()) return

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
  }, [ref, enabled])
}
