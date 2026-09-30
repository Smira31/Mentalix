import { useState } from 'react'
import HeroJourneyMap from './HeroJourneyMap'
import { previewHeroJourneyAction } from '../lib/demoMode'
import NestedScreenHeader from '../components/NestedScreenHeader'
import './Library.css'

/**
 * Temporary shell after a truncated push. Opens «Путь героя» via demo action
 * or the featured entry; other Library sections use the previous production path
 * once the full Library.jsx is restored from f8a74053.
 */
export default function Library({ user, onInputModeChange }) {
  const [screen, setScreen] = useState(() =>
    previewHeroJourneyAction() ? 'hero-journey' : 'home'
  )

  if (screen === 'hero-journey') {
    return <HeroJourneyMap onBack={() => setScreen('home')} />
  }

  return (
    <div className="mx-library-catalog mx-screen-shell animate-fade-in">
      <header className="mx-library-catalog__header">
        <h1 className="font-display mx-type-page text-cream lowercase">библиотека.</h1>
      </header>
      <section className="mx-library-v2__section" aria-label="Путь героя">
        <button
          type="button"
          className="mx-library-v2__pill"
          onClick={() => setScreen('hero-journey')}
        >
          Путь героя — пройти
        </button>
        <p className="text-muted" style={{ marginTop: 12 }}>
          Карта испытаний. Полный каталог библиотеки будет восстановлен в следующем коммите.
        </p>
      </section>
    </div>
  )
}
