import { useEffect, useMemo, useState } from 'react'
import './PracticeWritingCanvas.css'

function useVisualViewportMetrics() {
  const [metrics, setMetrics] = useState(() => ({
    height:
      typeof window === 'undefined' ? null : (window.visualViewport?.height ?? window.innerHeight),
    offsetTop: typeof window === 'undefined' ? 0 : (window.visualViewport?.offsetTop ?? 0),
    pageTop: typeof window === 'undefined' ? 0 : (window.visualViewport?.pageTop ?? window.scrollY),
    layoutHeight: typeof window === 'undefined' ? null : window.innerHeight,
  }))

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined
    const update = () =>
      setMetrics({
        height: viewport.height,
        offsetTop: viewport.offsetTop,
        pageTop: viewport.pageTop,
        layoutHeight: window.innerHeight,
      })
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return metrics
}

export default function PracticeWritingCanvas({
  value = '',
  onChange,
  question,
  description,
  placeholder = 'Начни писать…',
  ariaLabel,
  onSubmit,
  submitLabel = 'Дальше',
  submitDisabled = false,
  submitLoading = false,
  onDeepen,
  deepenLabel = 'Пойти глубже',
  deepenDisabled,
  deepenLoading = false,
  autoFocus = false,
  className = '',
}) {
  const [focused, setFocused] = useState(autoFocus)
  const metrics = useVisualViewportMetrics()
  const keyboardOpen =
    focused && metrics.height !== null && metrics.height < metrics.layoutHeight - 80
  const hasText = Boolean(String(value).trim())
  const submitIsDisabled = submitDisabled || submitLoading || !hasText
  const deepenIsDisabled = (deepenDisabled ?? !hasText) || submitLoading || deepenLoading
  const dockStyle = useMemo(() => {
    if (!keyboardOpen || metrics.height === null) return undefined
    return {
      top: `${metrics.pageTop + metrics.offsetTop + metrics.height - 48 - 56 - 8}px`,
    }
  }, [keyboardOpen, metrics])

  return (
    <section
      className={`practice-writing-canvas ${keyboardOpen ? 'is-keyboard-open' : ''} ${className}`}
    >
      <h1 className="practice-writing-canvas__question">{question}</h1>
      {description && <p className="practice-writing-canvas__description">{description}</p>}
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={ariaLabel || question}
        autoFocus={autoFocus}
        className="practice-writing-canvas__field"
      />
      <div className="practice-writing-canvas__dock" style={dockStyle} aria-label="Действия ввода">
        {onDeepen && (
          <button
            type="button"
            aria-label={deepenLabel}
            disabled={deepenIsDisabled}
            onClick={onDeepen}
            className="practice-writing-canvas__deepen"
          >
            {deepenLabel}
          </button>
        )}
        <button
          type="button"
          aria-label={submitLabel}
          disabled={submitIsDisabled}
          onClick={onSubmit}
          className="practice-writing-canvas__submit"
        >
          ✓
        </button>
      </div>
    </section>
  )
}
