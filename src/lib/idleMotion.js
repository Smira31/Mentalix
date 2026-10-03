/*
 * MXL-PERF-SCROLL: пауза бесконечных анимаций.
 *
 * Пока страница прокручивается, декоративные бесконечные анимации
 * (float/sway/glow, семантические глифы) перерисовываются в каждом кадре
 * и съедают бюджет кадра скролла. Класс mx-is-scrolling на <html> ставит
 * их на паузу (правило в index.css) и снимает после короткой паузы без
 * скролла. Слушатель passive + capture: scroll не всплывает, но ловится
 * на фазе захвата для любых вложенных контейнеров. Класс меняется только
 * на границе «скроллим/стоим» — React не задействован.
 */

import { useEffect } from 'react'

const IDLE_MS = 180

export function initIdleMotionPause() {
  if (typeof window === 'undefined') return () => {}

  const root = document.documentElement
  let timer = null
  let active = false

  const setActive = next => {
    if (active === next) return
    active = next
    root.classList.toggle('mx-is-scrolling', next)
  }

  const markActive = () => {
    setActive(true)
    if (timer !== null) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = null
      setActive(false)
    }, IDLE_MS)
  }

  window.addEventListener('scroll', markActive, { passive: true, capture: true })

  return () => {
    window.removeEventListener('scroll', markActive, { capture: true })
    if (timer !== null) window.clearTimeout(timer)
    timer = null
    setActive(false)
  }
}

/*
 * Пауза анимаций конкретного блока, когда он вне экрана: обёртка глифа
 * получает mx-motion-paused (правило в index.css), и бесконечные
 * анимации внутри перестают тикать за пределами viewport. Класс на
 * элементе — без ре-рендеров React.
 */
export function usePauseOffscreenMotion(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof window.IntersectionObserver !== 'function') return undefined

    const observer = new window.IntersectionObserver(entries => {
      for (const entry of entries) {
        el.classList.toggle('mx-motion-paused', !entry.isIntersecting)
      }
    })

    observer.observe(el)

    return () => {
      observer.disconnect()
      el.classList.remove('mx-motion-paused')
    }
  }, [ref])
}
