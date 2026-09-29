import { useEffect, useRef } from 'react'

import { platform } from '../../platform'
import {
  EDGE_WIDTH,
  isEdgeStart,
  isHorizontalSwipe,
  shouldTriggerEdgeBack,
  edgeBackdropOpacity,
} from './swipeThresholds'

/*
 * СВАЙП ОТ ЛЕВОГО КРАЯ = «НАЗАД» (iOS/Stoic-эталон, DESIGN_SYSTEM.md §6)
 *
 * Жест начинается только в полосе EDGE_WIDTH (24 px) от левого края.
 * Во время жеста экран сдвигается за пальцем (translateX), под ним
 * слегка затемнённый предыдущий слой. Отпустил до порога — пружиной
 * возвращается; после порога — уезжает вправо и вызывается onBack.
 *
 * 60 fps: только transform/opacity, без layout.
 * prefers-reduced-motion: без анимации сдвига, только действие.
 * Haptic light при срабатывании.
 *
 * Обработчики навешены на элемент экрана (ref), а не на document —
 * это не конфликтует с нативным жестом Telegram, потому что
 * disableVerticalSwipes уже отключил перехват вертикальных свайпов,
 * а горизонтальный свайп от края в полосе 24 px — наша зона.
 */

const SPRING_TRANSITION = 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)'
const EXIT_TRANSITION = 'transform 200ms ease-in'

export function useEdgeSwipeBack(ref, onBack, { enabled = true } = {}) {
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    if (!enabled) return

    const el = ref.current
    if (!el) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let startX = 0
    let startY = 0
    let lastX = 0
    let startTime = 0
    let active = false
    let locked = false // горизонталь подтверждена
    let backdrop = null

    function createBackdrop() {
      backdrop = document.createElement('div')
      backdrop.style.cssText =
        'position:fixed;inset:0;z-index:55;background:#000;opacity:0;pointer-events:none;transition:opacity 200ms ease-out;'
      // Тот же parent, что у экрана — сохраняет stacking context
      const parent = el.parentElement || document.body
      parent.appendChild(backdrop)
    }

    function removeBackdrop() {
      if (backdrop) {
        const b = backdrop
        backdrop = null
        b.style.opacity = '0'
        setTimeout(() => b.remove(), 250)
      }
    }

    function reset() {
      el.style.transition = SPRING_TRANSITION
      el.style.transform = ''
      el.style.willChange = ''
      removeBackdrop()
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      if (!isEdgeStart(touch.clientX)) return

      startX = touch.clientX
      startY = touch.clientY
      lastX = startX
      startTime = Date.now()
      active = true
      locked = false
    }

    function onTouchMove(e) {
      if (!active) return

      const touch = e.touches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY

      // Пока не заблокированы — определяем направление
      if (!locked) {
        if (Math.abs(dy) > 10 && !isHorizontalSwipe(dx, dy)) {
          // Вертикальный свайп — отменяем жест
          active = false
          return
        }
        if (Math.abs(dx) > 8 && isHorizontalSwipe(dx, dy)) {
          locked = true
          if (!reducedMotion) {
            el.style.willChange = 'transform'
            createBackdrop()
          }
        } else {
          return // недостаточно движения для определения
        }
      }

      // Жест заблокирован в горизонтальном направлении
      lastX = touch.clientX
      const offset = Math.max(0, dx)

      if (reducedMotion) return // без визуального сдвига

      el.style.transition = 'none'
      el.style.transform = `translateX(${offset}px)`
      if (backdrop) {
        backdrop.style.opacity = String(
          edgeBackdropOpacity(offset, window.innerWidth)
        )
      }

      // Предотвращаем скролл во время жеста
      if (e.cancelable) e.preventDefault()
    }

    function onTouchEnd() {
      if (!active) return
      active = false

      const dx = lastX - startX
      const distance = Math.max(0, dx)
      const elapsed = Date.now() - startTime
      const velocity = elapsed > 0 ? distance / elapsed : 0

      if (!locked) return // жест не успел определиться

      if (shouldTriggerEdgeBack(distance, window.innerWidth, velocity)) {
        platform.haptic('light')

        if (reducedMotion) {
          reset()
          onBackRef.current?.()
          return
        }

        el.style.transition = EXIT_TRANSITION
        el.style.transform = `translateX(${window.innerWidth}px)`
        if (backdrop) backdrop.style.opacity = '0.6'

        const cb = onBackRef.current
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
      if (backdrop) backdrop.remove()
    }
  }, [ref, enabled])
}
