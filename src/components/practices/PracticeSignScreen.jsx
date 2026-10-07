import { createPortal } from 'react-dom'
import { platform } from '../../platform'
import { useBackButton } from '../../platform/telegram.hooks'
import { RoundBackButton } from '../NestedScreenHeader'
import PracticeIcon, { resolveGlyphKey } from '../PracticeIcon'
import { PRACTICE_GLYPHS } from '../../lib/practiceWording'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  getFullscreenPortalTarget,
} from '../../lib/fullscreenSurface'
import './PracticeSignScreen.css'

/*
 * «Знак» практики — выбор иконки PracticeIcon сеткой 5×4.
 * Один набор знаков на ритуалы и аскезы: визуальный язык общий.
 * Выбранный знак едет вместе с практикой (поле glyph).
 */
export default function PracticeSignScreen({ title, subtitle, current, onPick, onCancel, systemBack = true }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  useBackButton(onCancel, systemBack)

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-practice-sign`} style={surfaceStyle}>
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mx-practice-sign__header px-[var(--mx-screen-x)]`}
      >
        <div className="w-full max-w-md mx-auto">
          <RoundBackButton onClick={onCancel} />
        </div>
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] pt-4">
          <h2 className="mx-practice-sign__title">{title}</h2>
          <p className="mx-practice-sign__subtitle">{subtitle}</p>

          <div className="mx-practice-sign__grid" data-testid="practice-sign-grid">
            {PRACTICE_GLYPHS.map(kind => {
              const active = resolveGlyphKey(kind) === resolveGlyphKey(current)
              return (
                <button
                  type="button"
                  key={kind}
                  className={`mx-practice-sign__cell${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  aria-label={`Знак ${kind}`}
                  data-testid={`practice-sign-${kind}`}
                  onClick={() => {
                    platform.haptic('light')
                    onPick(kind)
                  }}
                >
                  <PracticeIcon glyph={kind} className="w-full h-full" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
