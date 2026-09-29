import { Component } from 'react'

/**
 * ErrorBoundary верхнего уровня.
 *
 * Вместо «Minified React error» показывает экран «Что-то пошло не так»
 * с кнопками «Перезапустить» (location.reload) и «Скопировать отчёт».
 *
 * Отчёт содержит: error.message, error.stack, errorInfo.componentStack
 * (имена компонентов), время, userAgent, размеры viewport,
 * Telegram.WebApp.platform/version, текущую вкладку.
 */

function buildReport(error, errorInfo) {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const tab = params.get('tab') || 'today'

  const lines = [
    'Mentalix — отчёт об ошибке',
    '',
    `Время: ${new Date().toISOString()}`,
    `User-Agent: ${navigator.userAgent}`,
    `Viewport: ${window.innerWidth}×${window.innerHeight}`,
    `Вкладка: ${tab}`,
    `Telegram platform: ${tg?.platform || 'недоступно'}`,
    `Telegram version: ${tg?.version || 'недоступно'}`,
    '',
    '--- error.message ---',
    error?.message || '(нет сообщения)',
    '',
    '--- error.stack ---',
    error?.stack || '(нет стека)',
    '',
    '--- componentStack ---',
    errorInfo?.componentStack || '(нет componentStack)',
  ]

  return lines.join('\n')
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, copied: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleCopy = async () => {
    const report = buildReport(this.state.error, this.state.errorInfo)
    try {
      await navigator.clipboard.writeText(report)
    } catch {
      // Fallback для старых браузеров и Telegram WebView
      const textarea = document.createElement('textarea')
      textarea.value = report
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
      } catch {
        // ignore
      }
      document.body.removeChild(textarea)
    }
    this.setState({ copied: true })
    setTimeout(() => this.setState({ copied: false }), 2000)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="
            min-h-[100dvh]
            bg-emerald-deep
            text-cream
            flex
            flex-col
            items-center
            justify-center
            px-6
            font-body
          "
        >
          <h1
            className="
              font-display
              text-[20px]
              text-cream
              mb-3
            "
          >
            Что-то пошло не так
          </h1>
          <p
            className="
              text-[14px]
              text-muted
              text-center
              mb-8
              max-w-sm
            "
          >
            Произошла непредвиденная ошибка. Скопируй отчёт и отправь разработчику,
            затем перезапусти приложение.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              data-testid="error-reload"
              onClick={this.handleReload}
              className="
                w-full
                py-3
                rounded-2xl
                bg-gold
                text-emerald-deep
                font-semibold
                text-[15px]
              "
            >
              Перезапустить
            </button>
            <button
              type="button"
              data-testid="error-copy"
              onClick={this.handleCopy}
              className="
                w-full
                py-3
                rounded-2xl
                border
                border-cream/20
                text-cream
                font-semibold
                text-[15px]
              "
            >
              {this.state.copied ? 'Скопировано ✓' : 'Скопировать отчёт'}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
