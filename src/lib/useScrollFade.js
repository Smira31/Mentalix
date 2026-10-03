import { useEffect, useRef } from 'react'

/**
 * Общий хук затухания контента под шапкой Telegram.
 *
 * Ставит data-атрибут на .mx-app-scroll-root только когда значение
 * реально меняется (сравнение с прошлым в ref), а не на каждом событии
 * scroll. Визуальный слой (.mx-scroll-fade-top в index.css) читает
 * атрибут через sibling-селектор ~ — без :has() и без mask-image.
 *
 * @param {string} attrName — имя data-атрибута в camelCase (без префикса data-)
 * @param {boolean} active — включён ли механизм (например, каталог виден)
 */
export function useScrollFade(attrName, active = true) {
  const lastValueRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const root = document.querySelector('.mx-app-scroll-root')
    if (!root) return undefined

    const sync = () => {
      // На iPhone в Telegram document может прокручиваться вместо
      // scroll-root (overflow: hidden на shell не всегда работает на iOS).
      // Берём максимум из обоих источников — как BottomNavigation.
      const scrolled = Math.max(root.scrollTop, window.scrollY || 0)
      const next = scrolled > 2 ? '1' : '0'
      if (lastValueRef.current === next) return
      lastValueRef.current = next
      root.dataset[attrName] = next
    }

    sync()
    root.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('scroll', sync, { passive: true })
    return () => {
      root.removeEventListener('scroll', sync)
      window.removeEventListener('scroll', sync)
      delete root.dataset[attrName]
      lastValueRef.current = null
    }
  }, [attrName, active])
}
