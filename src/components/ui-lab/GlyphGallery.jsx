import SemanticGlyph from '../SemanticGlyph'

/*
 * ВРЕМЕННЫЙ СМОТРОВОЙ МАРШРУТ — ?glyph_gallery=1
 *
 * Показывает все 23 kind, которые умеет рисовать SemanticGlyph.jsx,
 * не только 5, уже используемых для обложек статей. Нужен, чтобы
 * подобрать знак для новой статьи (например, про дофаминовую яму),
 * не читая код. Размер карточки — тот же, что у ArticleCover
 * (variant="block"): rounded-2xl, bg-artbed, border-cream/[0.07].
 *
 * Dev/Preview-only, см. src/main.jsx. Ничего в реальных экранах
 * не меняет и не используется реальными компонентами.
 */

const KINDS = [
  'neuro',
  'brain-attention',
  'brain-memory',
  'brain-reaction',
  'brain-plasticity',
  'brain-gymnastics',
  'breath',
  'focus',
  'meditation',
  'prayer',
  'shower',
  'purpose',
  'water',
  'alcohol',
  'smoking',
  'mentor',
  'companion',
  'pathfinder',
  'anxiety',
  'sleep',
  'asceza',
  'ritual',
  'next-step',
]

export default function GlyphGallery() {
  return (
    <div className="min-h-[100dvh] bg-emerald-deep px-5 py-8">
      <h1 className="font-display text-[22px] text-cream mb-1">Галерея SemanticGlyph</h1>
      <p className="text-[13px] text-muted mb-6">
        Все {KINDS.length} kind — временный смотровой маршрут, не часть реальных экранов.
      </p>

      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        {KINDS.map(kind => (
          <div key={kind} className="flex flex-col items-center gap-2">
            <div className="w-[112px] h-[132px] rounded-2xl bg-artbed border border-cream/[0.07] overflow-hidden flex items-center justify-center">
              <SemanticGlyph kind={kind} className="w-full h-full p-1.5" />
            </div>
            <span className="text-[11px] text-faint text-center break-all">{kind}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
