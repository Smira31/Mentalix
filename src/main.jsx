import { StrictMode, Component, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const showcaseRequested =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('showcase') === 'archetypes'

const uiLabRequested =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('ui_lab') === '1'

const motionKitEnabled = import.meta.env.DEV || import.meta.env.VERCEL_ENV === 'preview'

const motionKitRequested =
  motionKitEnabled && new URLSearchParams(window.location.search).get('motion_kit') === '1'

const cardLabEnabled = import.meta.env.DEV || import.meta.env.VERCEL_ENV === 'preview'

const cardLabRequested =
  cardLabEnabled && new URLSearchParams(window.location.search).get('card_lab') === '1'

const onboardingPreviewRequested =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('onboarding_preview') === '1'

const ArchetypeShowcase = import.meta.env.DEV
  ? lazy(() => import('./components/archetype-art/ArchetypeShowcase'))
  : null

const UiExperiments = import.meta.env.DEV
  ? lazy(() => import('./components/ui-lab/UiExperiments'))
  : null

const PracticeMotionKit = motionKitEnabled
  ? lazy(() => import('./components/ui-lab/PracticeMotionKit'))
  : null

const CardDirectionsLab = cardLabEnabled
  ? lazy(() => import('./components/ui-lab/CardDirectionsLab'))
  : null

const OnboardingPreview = import.meta.env.DEV ? lazy(() => import('./screens/Onboarding')) : null

function RootScreen() {
  if (cardLabRequested && CardDirectionsLab) {
    return (
      <Suspense fallback={<div className="min-h-[100dvh] bg-emerald-deep" />}>
        <CardDirectionsLab />
      </Suspense>
    )
  }

  if (motionKitRequested && PracticeMotionKit) {
    return (
      <Suspense fallback={<div className="min-h-[100dvh] bg-emerald-deep" />}>
        <PracticeMotionKit />
      </Suspense>
    )
  }

  if (onboardingPreviewRequested && OnboardingPreview) {
    return (
      <Suspense fallback={<div className="min-h-[100dvh] bg-emerald-deep" />}>
        <OnboardingPreview user={null} onFinish={() => window.location.reload()} />
      </Suspense>
    )
  }

  if (uiLabRequested && UiExperiments) {
    return (
      <Suspense fallback={<div className="min-h-[100dvh] bg-emerald-deep" />}>
        <UiExperiments />
      </Suspense>
    )
  }

  if (showcaseRequested && ArchetypeShowcase) {
    return (
      <Suspense fallback={<div className="min-h-[100dvh] bg-emerald-deep" />}>
        <ArchetypeShowcase />
      </Suspense>
    )
  }

  return <App />
}

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
        <div
          style={{
            padding: 24,
            color: '#F5F5F5',
            background: '#0A0A0A',
            minHeight: '100vh',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 12 }}>
            Ошибка приложения — покажи этот экран разработчику:
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#D9B45B' }}>
            {String(
              this.state.error &&
                (this.state.error.stack || this.state.error.message || this.state.error)
            )}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

window.addEventListener('error', e => {
  const root = document.getElementById('root')
  if (root && !root.hasChildNodes()) {
    root.innerHTML =
      '<pre style="padding:24px;color:#D9B45B;background:#0A0A0A;min-height:100vh;white-space:pre-wrap;font-size:13px">Ошибка загрузки — покажи разработчику:\n\n' +
      (e.message || e.error) +
      '</pre>'
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RootScreen />
    </ErrorBoundary>
  </StrictMode>
)
