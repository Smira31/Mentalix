import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * StepSlide — горизонтальный переход между шагами чек-ина (§6, часть 1).
 *
 * Эталон — DESIGN_SYSTEM.md §6 «Шаг → следующий шаг»: текущий шаг уходит
 * влево, следующий приходит справа; «Назад» — зеркально. Длительность и
 * кривая взяты из §6 (видео Stoic 23.09.2026): 300 мс, кривая «шторка»
 * cubic-bezier(0.32, 0.72, 0, 1). Прозрачность для этого перехода в §6 не
 * указана — анимируем только transform (сдвиг), как в эталоне.
 *
 * Анимация — только transform, без перерисовки layout. В покое track имеет
 * transform: none, поэтому position: fixed потомки (тулбар JournalTextarea)
 * остаются привязаны к viewport, а не к слайду.
 *
 * Содержимое старого шага НЕ перемонтируется на старте перехода: pane
 * ключится значением шага, так что старая панель сохраняет свой React-инстанс
 * (важно для фокуса/клавиатуры текстовых шагов). Новая панель монтируется
 * свежей (autoFocus срабатывает на новом поле). По завершении анимации
 * старая панель размонтируется.
 *
 * prefers-reduced-motion — мгновенная смена, без сдвига.
 *
 * Повторное нажатие во время анимации блокируется родителем через animatingRef
 * (см. goToStep в CheckIn.jsx): StepSlide держит animatingRef.current=true
 * до конца перехода.
 */
const DURATION = 300
const EASING = 'cubic-bezier(0.32, 0.72, 0, 1)'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function StepSlide({
  stepKey,
  direction = 'forward',
  animatingRef = null,
  children,
  className = '',
}) {
  // Ключи шагов, отображаемых в треке: в покое [stepKey], на переходе [from, to].
  const [paneKeys, setPaneKeys] = useState([stepKey])
  const lastKeyRef = useRef(stepKey)
  const lastChildrenRef = useRef(children)
  const prevKeyRef = useRef(null)
  const prevChildrenRef = useRef(null)
  const trackRef = useRef(null)
  const timerRef = useRef(0)
  const animCfgRef = useRef(null)

  // Фаза рендера: ловим смену шага и захватываем содержимое уходящей панели
  // ДО того, как эффект обновит lastChildrenRef. Здесь только чтение ref,
  // без записи в рендере — безопасно в StrictMode.
  if (stepKey !== lastKeyRef.current) {
    prevKeyRef.current = lastKeyRef.current
    prevChildrenRef.current = lastChildrenRef.current
  }

  // 1. На смену шага: готовим двухпанельный трек и запускаем переход.
  useLayoutEffect(() => {
    const from = lastKeyRef.current
    const to = stepKey
    if (from === to) return
    lastKeyRef.current = to

    clearTimeout(timerRef.current)
    if (prefersReducedMotion()) {
      setPaneKeys([to])
      prevKeyRef.current = null
      prevChildrenRef.current = null
      if (animatingRef) animatingRef.current = false
      return
    }

    if (animatingRef) animatingRef.current = true
    const ordered = direction === 'back' ? [to, from] : [from, to]
    animCfgRef.current = {
      start: direction === 'back' ? '-50%' : '0%',
      end: direction === 'back' ? '0%' : '-50%',
      to,
    }
    setPaneKeys(ordered)
  }, [stepKey, direction, animatingRef]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Каждый коммит: держим lastChildrenRef свежим для будущего захвата.
  useLayoutEffect(() => {
    lastChildrenRef.current = children
  })

  // 3. После коммита панелей: позиционируем трек и анимируем.
  useLayoutEffect(() => {
    const cfg = animCfgRef.current
    if (paneKeys.length === 2 && cfg) {
      const track = trackRef.current
      if (track) {
        track.style.transition = 'none'
        track.style.transform = `translateX(${cfg.start})`
        // force reflow, чтобы стартовая позиция зафиксировалась до анимации
        void track.offsetWidth
        track.style.transition = `transform ${DURATION}ms ${EASING}`
        track.style.transform = `translateX(${cfg.end})`
      }
      timerRef.current = setTimeout(() => {
        animCfgRef.current = null
        prevKeyRef.current = null
        prevChildrenRef.current = null
        setPaneKeys([cfg.to])
      }, DURATION)
    } else if (paneKeys.length === 1) {
      const track = trackRef.current
      if (track) {
        track.style.transition = 'none'
        track.style.transform = 'translateX(0%)'
      }
      if (animatingRef) animatingRef.current = false
    }
  }, [paneKeys, animatingRef])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className={`mx-step-slide ${className}`.trim()}>
      <div ref={trackRef} className="mx-step-slide__track">
        {paneKeys.map(k => (
          <div key={k} className="mx-step-slide__pane">
            {k === stepKey ? children : k === prevKeyRef.current ? prevChildrenRef.current : null}
          </div>
        ))}
      </div>
    </div>
  )
}
