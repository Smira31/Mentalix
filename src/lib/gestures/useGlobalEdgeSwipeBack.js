import { useEffect, useRef } from 'react'

import { platform } from '../../platform'
import { getCurrentBackAction } from '../../platform/telegram.hooks'
import {
  EDGE_WIDTH,
  isEdgeStart,
  isHorizontalSwipe,
  shouldTriggerEdgeBack,
  edgeBackdropOpacity,
} from './swipeThresholds'

/*
 * ГЛОБАЛЬНЫЙ СВАЙП «НАЗАД» ОТ ЛЕВОГО КРАЯ (DESIGN_SYSTEM.md §6)
 *
 * Один слушатель на корневом элементе приложения (App.jsx).
 * Touch-события со всех экранов и порталов всплывают к корню.
 *
 * Жест начинается только в полосе EDGE_WIDTH (24 px) от левого края.
 * Если движение вертикальное — жест отменяется, прокрутка работает.
 * Если горизонтальное — экран сдвигается за пальцем (translateX),
 * отпустил до порога — пружиной возвращается; после порога — onBack.
 *
 * Текущее действие «Назад» берётся из единого стека useBackButton
 * (telegram.hooks.js). Если стек пуст — свайп ничего не делает.
 *
 * preventDefault вызывается ТОЛЬКО во время уже начатого
 * горизонтального edge-swipe (старт в полосе 24 px, горизонталь >
 * вертикали). Вертикальная прокрутка одним пальцем не блокируется.
 *
 * 60 fps: только transform/opacity, без layout.
 * prefers-reduced-motion: без анимации сдвига, только действие.
 * Haptic light при срабатывании.
 */

const SPRING_TRANSITION = 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)'
const EXIT_TRANSITION = 'transform 200ms ease-in'

/**
 * Найти верхний полноэкранный портал для визуального сдвига.
 * Если портала нет — вернуть null (свайп без визуальной анимации).
 */
function findTopSurface(rootEl) {
  if (!rootEl) return null
  // Полноэкранные оверлеи имеют класс fixed top-0 ... (FULLSCREEN_SHELL_CLASS).
  // Ищем последний в DOM внутри корня — он самый верхний.
  const surfaces = rootEl.querySelectorAll(
    '.fixed.top-0.left-0.right-0.z-\\[60\\]'
  )
  if (surfaces.length > 0) return surfaces[surfaces.length - 1]
  return null
}

export function useGlobalEdgeSwipeBack(ref, { enabled = true } = {}) {
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
    let surface = null
    let backdrop = null

    function createBackdrop() {
      backdrop = document.createElement('div')
      backdrop.style.cssText =
        'position:fixed;inset:0;z-index:55;background:#000;opacity:0;pointer-events:none;transition:opacity 200ms ease-out;'
      document.body.appendChild(backdrop)
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
      if (surface) {
        surface.style.transition = SPRING_TRANSITION
        surface.style.transform = ''
        surface.style.willChange = ''
      }
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
          // Вертикальный свайп — отменяем жест, не трогаем прокрутку
          active = false
          return
        }
        if (Math.abs(dx) > 8 && isHorizontalSwipe(dx, dy)) {
          locked = true
          // Проверяем, есть ли действие «Назад»
          if (!getCurrentBackAction()) {
            active = false
            locked = false
            return
          }
          surface = findTopSurface(el)
          if (!reducedMotion && surface) {
            surface.style.willChange = 'transform'
            createBackdrop()
          }
        } else {
          return // недостаточно движения для определения
        }
      }

      // Жест заблокирован в горизонтальном направлении
      lastX = touch.clientX
      const offset = Math.max(0, dx)

      if (reducedMotion || !surface) return // без визуального сдвига

      surface.style.transition = 'none'
      surface.style.transform = `translateX(${offset}px)`
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

      const action = getCurrentBackAction()
      if (!action) {
        reset()
        surface = null
        return
      }

      if (shouldTriggerEdgeBack(distance, window.innerWidth, velocity)) {
        platform.haptic('light')

        if (reducedMotion || !surface) {
          surface = null
          action()
          return
        }

        surface.style.transition = EXIT_TRANSITION
        surface.style.transform = `translateX(${window.innerWidth}px)`
        if (backdrop) backdrop.style.opacity = '0.6'

        setTimeout(() => {
          reset()
          surface = null
          action()
        }, 200)
      } else {
        reset()
        surface = null
      }
    }

    // touchstart — passive, не блокирует прокрутку
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    // touchmove — passive:false нужен для preventDefault во время жеста.
    // Блокирует прокрутку ТОЛЬКО когда locked (горизонтальный edge-swipe).
    // Если жест не активен — обработчик сразу return, прокрутка работает.
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
