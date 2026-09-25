import { useEffect, useRef } from 'react'

/**
 * createDismissCallback — чистая функция-обработчик для IntersectionObserver.
 *
 * Логика (как у Stoic):
 *   1. Подсказка должна хотя бы раз стать видимой (intersectionRatio ≥ 0.5).
 *   2. Как только она после этого полностью уходит за верхний край
 *      (isIntersecting === false и boundingClientRect.top < 0),
 *      вызывается onDismiss — ровно один раз.
 *   3. Если подсказка ушла вниз (top ≥ 0), не показавшись, onDismiss не вызывается.
 *
 * Экспортирована для unit-теста; хук использует её внутри.
 */
export function createDismissCallback(onDismiss) {
  let dismissed = false
  let wasVisible = false

  return entries => {
    for (const entry of entries) {
      // Шаг 1: подсказка видима хотя бы наполовину
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        wasVisible = true
      }

      // Шаг 2: была видна → полностью ушла за верхний край
      if (
        !entry.isIntersecting &&
        wasVisible &&
        !dismissed &&
        entry.boundingClientRect.top < 0
      ) {
        dismissed = true
        onDismiss()
      }
    }
  }
}

/**
 * useAutoDismissOnScroll — закрывает подсказку, когда она была видна
 * и затем ПОЛНОСТЬЮ ушла за верхний край экрана при прокрутке.
 *
 * Прямо во время прокрутки подсказка НЕ убирается из вёрстки —
 * onDismiss помечает её закрытой навсегда (тем же ключом, что и крестик),
 * и при следующем открытии экрана её уже не будет.
 *
 * @param {React.RefObject<HTMLElement>} ref — ссылка на элемент-подсказку
 * @param {() => void} onDismiss — вызывается один раз при уходе вверх
 */
export function useAutoDismissOnScroll(ref, onDismiss) {
  // Стабильная ссылка, чтобы не пересоздавать observer при каждом рендере
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const callback = createDismissCallback(() => onDismissRef.current?.())
    const observer = new IntersectionObserver(callback, { threshold: [0, 0.5, 1] })

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}
