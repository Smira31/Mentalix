import { Component } from 'react'

/*
 * Защита экрана: ошибка любого экрана (или его ленивого чанка) не
 * роняет всё приложение в чёрный экран. Показываем «Что-то пошло не так»
 * и «На главную»; нижняя навигация и шапка App остаются живыми.
 *
 * resetKey — смена вкладки/оверлея или «На главную» снимает ошибку.
 */
export default class ScreenErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[ScreenErrorBoundary] ошибка экрана', {
      message: error?.message || String(error),
      componentStack: errorInfo?.componentStack || null,
    })
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        data-testid="screen-error"
        className="w-full max-w-md flex-1 flex flex-col items-center justify-center px-6 py-16 text-center font-body"
      >
        <h1 className="font-display text-[20px] text-cream mb-3">Что-то пошло не так</h1>
        <p className="text-[14px] text-muted mb-8 max-w-sm">
          Экран не открылся. Вернись на главную и попробуй ещё раз.
        </p>
        <button
          type="button"
          data-testid="screen-error-home"
          onClick={this.props.onHome}
          className="w-full max-w-xs py-3 rounded-2xl bg-gold text-emerald-deep font-semibold text-[15px] border-0"
        >
          На главную
        </button>
      </div>
    )
  }
}
