import { platform } from '../platform'
import OnboardingHero from '../components/OnboardingHero'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import './Onboarding.css'

export default function Onboarding({ onFinish }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  function finish() {
    platform.haptic('medium')
    onFinish()
  }

  return (
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <main className="mx-onboarding-step mx-onboarding-intro w-full max-w-md mx-auto px-8 text-center">
          <div className="mx-onboarding-intro-art" aria-hidden="true">
            <OnboardingHero className="mx-onboarding-intro-maze" />
          </div>

          <div className="mx-onboarding-intro-copy">
            <h1 className="font-display text-[30px] text-cream leading-tight">
              это Mentalix.
              <br />
              один шаг за раз
            </h1>

            <p className="text-[15px] text-muted leading-relaxed max-w-xs">
              Личная система, которая помогает понять своё состояние, выбрать главное на сегодня и
              со временем замечать закономерности.
            </p>

            <button type="button" onClick={finish} className="cta-pill text-[16px] px-14 py-4">
              Начать
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
