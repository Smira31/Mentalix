import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Ловушка ошибок: вместо чёрного экрана показываем текст ошибки,
// чтобы её можно было сфотографировать и починить
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#F5F5F5', background: '#0A0A0A', minHeight: '100vh', fontFamily: 'monospace', fontSize: 13 }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>Ошибка приложения — покажи этот экран разработчику:</p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#D9B45B' }}>
            {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

window.addEventListener('error', (e) => {
  const root = document.getElementById('root')
  if (root && !root.hasChildNodes()) {
    root.innerHTML = '<pre style="padding:24px;color:#D9B45B;background:#0A0A0A;min-height:100vh;white-space:pre-wrap;font-size:13px">Ошибка загрузки — покажи разработчику:\n\n' + (e.message || e.error) + '</pre>'
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
