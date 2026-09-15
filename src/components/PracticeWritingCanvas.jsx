import { useEffect, useRef, useState } from 'react'
import './PracticeWritingCanvas.css'

const DEMO_KEY_ROWS = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
]

function isDemoPreview() {
  return (
    typeof document !== 'undefined' &&
    Boolean(document.querySelector('[data-mentalix-demo-frame="true"]')) &&
    new URLSearchParams(window.location.search).get('keyboard') === '1'
  )
}

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
  formatting = false,
  onFormat,
  formatOpen = false,
  formatActions = null,
  onClose,
  autoFocus = false,
  keyboardDockMode = 'visual-viewport',
  className = '',
}) {
  const [focused, setFocused] = useState(autoFocus)
  const [demoKeyboard, setDemoKeyboard] = useState(false)
  const fieldRef = useRef(null)
  const focusedRef = useRef(autoFocus)
  const metrics = useVisualViewportMetrics()
  const demoPreview = isDemoPreview()
  const containedKeyboardDock = keyboardDockMode === 'contained'
  const keyboardOpen =
    focused && metrics.height !== null && metrics.height < metrics.layoutHeight - 80
  const visualKeyboardOpen = demoPreview && (demoKeyboard || focused)
  const hasText = Boolean(String(value).trim())
  const submitIsDisabled = submitDisabled || submitLoading || !hasText
  const deepenIsDisabled = (deepenDisabled ?? !hasText) || submitLoading || deepenLoading
  const dockStyle =
    containedKeyboardDock || (demoPreview && visualKeyboardOpen) || !keyboardOpen || metrics.height === null
      ? undefined
      : {
          top: `${metrics.pageTop + metrics.offsetTop + metrics.height - 48 - 56 - 8}px`,
        }
  useEffect(() => {
    if (!focusedRef.current || !fieldRef.current) return undefined

    const frame = window.requestAnimationFrame(() => {
      const field = fieldRef.current
      if (!field || document.activeElement === field) return

      field.focus({ preventScroll: true })
      const caret = field.value.length
      field.setSelectionRange(caret, caret)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [question])

  return (
    <section
      className={`practice-writing-canvas ${keyboardOpen ? 'is-keyboard-open' : ''} ${visualKeyboardOpen ? 'is-demo-keyboard-open' : ''} ${containedKeyboardDock ? 'is-contained-keyboard-dock' : ''} ${className}`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="practice-writing-canvas__close"
        >
          ×
        </button>
      )}
      <h1 className="practice-writing-canvas__question font-display">{question}</h1>
      {description && <p className="practice-writing-canvas__description">{description}</p>}
      <textarea
        ref={fieldRef}
        value={value}
        onChange={event => onChange(event.target.value)}
        onFocus={event => {
          setFocused(true)
          focusedRef.current = true
          if (demoPreview) setDemoKeyboard(true)
          if (demoPreview) {
            const resetFlowScroll = () => {
              let parent = event.currentTarget.parentElement
              while (parent && parent !== document.body) {
                if (parent.scrollHeight > parent.clientHeight) {
                  parent.scrollTo({ top: 0, behavior: 'auto' })
                }
                parent = parent.parentElement
              }
              window.scrollTo({ top: 0, behavior: 'auto' })
            }
            window.requestAnimationFrame(resetFlowScroll)
            window.setTimeout(resetFlowScroll, 120)
          }
        }}
        onBlur={() => {
          setFocused(false)
          focusedRef.current = false
        }}
        placeholder={placeholder}
        aria-label={ariaLabel || question}
        autoFocus={autoFocus}
        readOnly={demoPreview}
        inputMode={demoPreview ? 'none' : undefined}
        className="practice-writing-canvas__field font-body"
      />
      <div className="practice-writing-canvas__dock" style={dockStyle} aria-label="Действия ввода">
        {formatting && onFormat && (
          <button
            type="button"
            aria-label={formatOpen ? 'Скрыть форматирование' : 'Показать форматирование'}
            aria-expanded={formatOpen}
            onClick={onFormat}
            className={`practice-writing-canvas__format ${formatOpen ? 'is-open' : ''}`}
          >
            Aa
          </button>
        )}
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
        {onSubmit && (
          <button
            type="button"
            aria-label={submitLabel}
            disabled={submitIsDisabled}
            onPointerDown={event => {
              if (focusedRef.current) event.preventDefault()
            }}
            onClick={onSubmit}
            className="practice-writing-canvas__submit"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
              <path d="M6 4.5 12 10 6 15.5" />
            </svg>
          </button>
        )}
      </div>
      {demoPreview && visualKeyboardOpen && (
        <div className="practice-writing-canvas__demo-keyboard" aria-label="Демо-клавиатура iPhone">
          {DEMO_KEY_ROWS.map((row, rowIndex) => (
            <div className="practice-writing-canvas__demo-row" key={rowIndex}>
              {row.map(key => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => onChange(`${value}${key}`)}
                  className="practice-writing-canvas__demo-key"
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="practice-writing-canvas__demo-row practice-writing-canvas__demo-row--special">
            <button
              type="button"
              onClick={() => onChange(value.slice(0, -1))}
              className="practice-writing-canvas__demo-key practice-writing-canvas__demo-key--wide"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => onChange(`${value} `)}
              className="practice-writing-canvas__demo-key practice-writing-canvas__demo-key--space"
            >
              пробел
            </button>
            <button
              type="button"
              onClick={() => onChange(`${value}\n`)}
              className="practice-writing-canvas__demo-key practice-writing-canvas__demo-key--wide"
            >
              return
            </button>
          </div>
        </div>
      )}
      {formatting && formatOpen && formatActions}
    </section>
  )
}
