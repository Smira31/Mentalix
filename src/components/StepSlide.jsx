import { useLayoutEffect, useRef, useState } from 'react'

/*
 * StepSlide — §6, горизонтальный переход между шагами чек-ина.
 *
 * «Далее»/«Пропустить»: текущий шаг уходит влево, новый приходит справа.
 * «Назад» — зеркально (направление определяется по сравнению stepKey).
 *
 * Анимируются только transform и opacity (compositor-only, без перерисовки
 * layout). Длительность 300 мс, кривая «шторка» cubic-bezier(0.32, 0.72, 0, 1)
 * — из §6 и docs/references/stoic-video-2026-09-23.md.
 *
 * prefers-reduced-motion — без сдвига, мгновенная смена (клон не создаётся,
 * анимация не запускается).
 *
 * Во время анимации родитель получает onAnimatingChange(true) и должен
 * блокировать повторную навигацию (goToStep), чтобы не пропустить шаг и не
 * сломать состояние.
 *
 * Реализация: при смене stepKey предыдущий шаг (captured children) рендерится
 * в уходящем клон-панели, новый — в активной панели; обе анимируются через
 * Web Animations API. Уходящий панель помечается inert, чтобы autofocus
 * текстовых полей не перехватывался уходящей копией.
 */

const STEP_DURATION = 300
const STEP_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)'

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function StepSlide({ stepKey, children, onAnimatingChange, className = '' }) {
  const panelRef = useRef(null)
  const leavingRef = useRef(null)
  const lastChildrenRef = useRef(children)
  const prevKeyRef = useRef(stepKey)
  const [leaving, setLeaving] = useState(null)

  /*
   * На каждом коммите: если stepKey сменился — захватываем предыдущие children
   * как уходящий контент. Иначе — обновляем ref, чтобы при следующем переходе
   * захватить самые свежие children текущего шага (например, после выбора
   * варианта шкалы).
   */
  useLayoutEffect(() => {
    if (stepKey === prevKeyRef.current) {
      lastChildrenRef.current = children
      return
    }

    const direction = stepKey > prevKeyRef.current ? 1 : -1
    const leavingContent = lastChildrenRef.current
    const leavingKey = prevKeyRef.current
    prevKeyRef.current = stepKey
    lastChildrenRef.current = children

    // prefers-reduced-motion — мгновенная смена, без клона и анимации.
    if (prefersReducedMotion() || !leavingContent) {
      return
    }

    setLeaving({ content: leavingContent, direction, key: leavingKey })
  })

  /*
   * Запуск анимаций после монтирования уходящего клона.
   * Зависимость от [leaving]: срабатывает, когда клон добавлен в DOM.
   */
  useLayoutEffect(() => {
    if (!leaving) return

    const panel = panelRef.current
    const leavingEl = leavingRef.current

    if (!panel || !leavingEl) {
      setLeaving(null)
      return
    }

    // Уходящий клон не должен перехватывать фокус (inert блокирует autofocus
    // JournalTextarea в копии) и клики.
    leavingEl.inert = true

    const leaveAnim = leavingEl.animate(
      [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: `translateX(${-leaving.direction * 100}%)`, opacity: 0 },
      ],
      { duration: STEP_DURATION, easing: STEP_EASING, fill: 'forwards' }
    )

    const enterAnim = panel.animate(
      [
        { transform: `translateX(${leaving.direction * 100}%)`, opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      { duration: STEP_DURATION, easing: STEP_EASING, fill: 'none' }
    )

    onAnimatingChange?.(true)

    const timer = setTimeout(() => {
      setLeaving(null)
      onAnimatingChange?.(false)
    }, STEP_DURATION)

    return () => {
      clearTimeout(timer)
      leaveAnim.cancel()
      enterAnim.cancel()
    }
  }, [leaving])

  return (
    <div className={`mx-step-slide ${className}`.trim()}>
      {leaving ? (
        <div
          key={leaving.key}
          ref={leavingRef}
          className="mx-step-slide__panel mx-step-slide__clone"
          aria-hidden="true"
        >
          {leaving.content}
        </div>
      ) : null}
      <div key={stepKey} ref={panelRef} className="mx-step-slide__panel">
        {children}
      </div>
    </div>
  )
}
