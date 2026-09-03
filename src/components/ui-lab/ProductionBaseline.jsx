import { useState } from 'react'
import Analytics from '../../screens/Analytics'
import Library from '../../screens/Library'
import MentalixChat from '../../screens/Mentalix'
import Practices from '../../screens/Practices'
import Today from '../../screens/Today'
import { DEMO_USER } from '../../lib/demoMode'
import './ProductionBaseline.css'

const screens = [
  { key: 'today', label: 'Сегодня', source: 'src/screens/Today.jsx' },
  { key: 'practices', label: 'Практики', source: 'src/screens/Practices.jsx' },
  { key: 'mentor', label: 'Наставник', source: 'src/screens/Mentalix.jsx' },
  { key: 'library', label: 'Библиотека', source: 'src/screens/Library.jsx' },
  { key: 'trends', label: 'Аналитика', source: 'src/screens/Analytics.jsx' },
]

export default function ProductionBaseline() {
  const [screen, setScreen] = useState('today')
  const active = screens.find(item => item.key === screen)

  return (
    <section className="mx-production-baseline" aria-labelledby="production-baseline-title">
      <header className="mx-production-baseline__header">
        <span>Эталон · production components</span>
        <h2 id="production-baseline-title">Основные экраны Mentalix</h2>
        <p>
          Один и тот же production-компонент, который используется в приложении. Переключатель ниже
          заменяет production bottom navigation только внутри эталона — данные берутся из
          безопасного preview-demo, не из пользовательского аккаунта.
        </p>
      </header>

      <nav className="mx-production-baseline__tabs" aria-label="Экраны production-эталона">
        {screens.map(item => (
          <button
            key={item.key}
            type="button"
            aria-pressed={screen === item.key}
            onClick={() => setScreen(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mx-production-baseline__meta">
        <span>{active.source}</span>
        <strong>живой рендер · read-only baseline</strong>
      </div>

      <div className="mx-production-baseline__stage">
        {screen === 'today' && (
          <Today
            user={DEMO_USER}
            onOpenPractice={() => {}}
            onGoMentor={() => setScreen('mentor')}
            onFlowChange={() => {}}
            onReturnFlowEvent={() => {}}
            onCloseSeries={() => {}}
          />
        )}
        {screen === 'practices' && (
          <Practices
            user={DEMO_USER}
            onGameChange={() => {}}
            onReturnToToday={() => setScreen('today')}
          />
        )}
        {screen === 'mentor' && <MentalixChat user={DEMO_USER} onPersonaChange={() => {}} />}
        {screen === 'library' && <Library user={DEMO_USER} />}
        {screen === 'trends' && (
          <Analytics user={DEMO_USER} onGoCheckin={() => setScreen('today')} />
        )}
      </div>
    </section>
  )
}
