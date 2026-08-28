import BackButton from '../BackButton'
import SemanticGlyph from '../SemanticGlyph'
import { FULLSCREEN_HEADER_SLOT_CLASS, FULLSCREEN_SCROLL_CLASS } from '../../lib/fullscreenSurface'

import './SceneLayout.css'

export default function SceneLayout({
  onBack,
  label,
  title,
  description = null,
  children,
  className = '',
  centered = false,
  verticallyCentered = false,
  scrollRef = null,
  showGlyph = true,
  progress = null,
}) {
  return (
    <>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center gap-3 px-5`}>
        <BackButton onClick={onBack} />
      </div>

      <div
        ref={scrollRef}
        className={`${FULLSCREEN_SCROLL_CLASS} px-5 pb-8 ${verticallyCentered ? 'justify-center' : ''}`}
      >
        <div
          className={`practice-scene w-full max-w-md mx-auto pt-8 pb-12 ${
            centered ? 'practice-scene--centered' : ''
          } ${className}`}
        >
          {showGlyph && (
            <div
              className="practice-scene__glyph mx-auto mb-7 h-[72px] w-[124px]"
              aria-hidden="true"
            >
              <SemanticGlyph kind="next-step" animated={false} />
            </div>
          )}

          <div className="practice-scene__body">
            {progress}

            <span className="block font-label text-[11px] font-bold uppercase tracking-wider text-gold mb-3">
              {label}
            </span>

            <h2 className="font-display text-[24px] text-cream leading-tight">{title}</h2>

            {description && (
              <div className="practice-scene__description text-[13px] text-muted mt-5 leading-relaxed">
                {description}
              </div>
            )}

            <div className="practice-scene__content">{children}</div>
          </div>
        </div>
      </div>
    </>
  )
}
