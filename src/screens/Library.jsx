import { useState } from 'react'
import HeroJourneyMap from './HeroJourneyMap'
import './Library.css'

function isHeroJourneyDemo() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') === '1' && params.get('action') === 'hero_journey'
}

/** Temporary shell: full Library will be restored from f8a74053 in a follow-up. */
export default function Library() {
  const [screen, setScreen] = useState(() => (isHeroJourneyDemo() ? 'hero-journey' : 'home'))

  if (screen === 'hero-journey') {
    return <HeroJourneyMap onBack={() => setScreen('home')} />
  }

  return (
    <div className="mx-library-catalog mx-screen-shell animate-fade-in">
      <header className="mx-library-catalog__header">
        <h1 className="font-display mx-type-page text-cream lowercase">библиотека.</h1>
      </header>
      <section className="mx-library-v2__section" aria-label="Путь героя">
        <button type="button" className="mx-library-v2__pill" onClick={() => setScreen('hero-journey')}>
          Путь героя — пройти
        </button>
      </section>
    </div>
  )
}
