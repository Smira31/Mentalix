import { ARCHETYPE_ART } from './ArchetypeArt'
import './ArchetypeShowcase.css'


const ARCHETYPES = [
  {
    key: 'labyrinth',
    name: 'Лабиринт',
    meaning: 'Путь к себе, движение без обнуления, прогресс.',
  },
]


function Preview({
  Art,
  animated,
  label,
  compact = false,
}) {
  return (
    <div>
      <div
        className={[
          'bg-artbed text-gold rounded-[16px] border border-cream/[0.07] flex items-center justify-center overflow-hidden',
          compact ? 'h-[116px]' : 'h-[280px]',
        ].join(' ')}
      >
        <Art
          animated={animated}
          className={compact ? 'w-[108px] h-[108px]' : 'w-[252px] h-[252px]'}
        />
      </div>

      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
    </div>
  )
}


function ArchetypeCard({ item }) {
  const Art = ARCHETYPE_ART[item.key]

  return (
    <article className="rounded-[28px] bg-emerald border border-cream/[0.10] p-3.5 sm:p-4">
      <Preview
        Art={Art}
        animated
        label="Крупно · анимация"
      />

      <div className="px-1 pt-5 pb-4">
        <h2 className="font-display text-[22px] leading-tight text-cream">
          {item.name}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {item.meaning}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Preview
          Art={Art}
          animated={false}
          compact
          label="Малый · статично"
        />
        <Preview
          Art={Art}
          animated
          compact
          label="Малый · motion"
        />
      </div>
    </article>
  )
}


export default function ArchetypeShowcase() {
  return (
    <main className="min-h-[100dvh] bg-emerald-deep text-cream px-5 py-10 sm:py-14">
      <div className="w-full max-w-6xl mx-auto">
        <header className="max-w-xl mb-9 sm:mb-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold mb-4">
            Dev-only · visual approval
          </div>
          <h1 className="font-display text-[34px] sm:text-[42px] leading-[1.04] tracking-[-0.035em]">
            Архетипы Mentalix
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Один центр света. Всё остальное — то, как вокруг него устроено пространство.
          </p>
        </header>

        <section className="max-w-[410px]">
          {ARCHETYPES.map((item) => (
            <ArchetypeCard key={item.key} item={item} />
          ))}
        </section>

        <p className="mt-8 font-mono text-[10px] leading-relaxed uppercase tracking-[0.12em] text-faint">
          Системная настройка reduced motion автоматически оставляет каждый символ в читаемом финальном состоянии.
        </p>
      </div>
    </main>
  )
}
