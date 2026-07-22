import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { Sparkles, Flame, Snowflake, ArrowRight, Footprints } from 'lucide-react'

const SLIDES = [
  {
    Icon: Sparkles,
    title: 'Добро пожаловать в Менталикс',
    text: 'Mentalix — это личная система психологической поддержки и развития, которая помогает меньше теряться в своих мыслях и постепенно менять жизнь с помощью небольших ежедневных действий.',
  },
  {
    Icon: Flame,
    title: 'Как это работает',
    text: 'Каждый день ты отмечаешь короткий чек-ин и свои привычки. Из маленьких регулярных шагов складывается серия — и ты видишь, как система работает на тебя, даже когда нет мотивации.',
  },
  {
    Icon: Footprints,
    title: 'Твой первый шаг',
    text: 'Начни с одного маленького шага. Одна привычка, один чек-ин — этого достаточно, чтобы система пришла в движение.',
  },
]

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1
  const slide = SLIDES[index]
  const Icon = slide.Icon

  function next() {
    haptic('light')
    if (isLast) {
      onFinish()
    } else {
      setIndex((i) => i + 1)
    }
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10 min-h-[70vh] flex flex-col animate-fade-in">
      <div className="flex justify-end pt-2">
        <button
          onClick={() => { haptic('light'); onFinish() }}
          className="text-cream/40 text-xs px-2 py-1"
        >
          Пропустить
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-[28px] bg-emerald-light/30 border border-gold/30 flex items-center justify-center mb-8">
          <Icon size={36} className="text-gold" strokeWidth={1.5} />
        </div>

        <h2 className="font-display text-2xl text-cream mb-4 leading-snug">{slide.title}</h2>
        <p className="font-body text-sm text-cream/60 leading-relaxed">{slide.text}</p>

        {index === 1 && (
          <div className="flex items-center gap-4 mt-6">
            <span className="flex items-center gap-1.5 text-xs text-gold">
              <Flame size={16} /> серия
            </span>
            <span className="flex items-center gap-1.5 text-xs text-mint">
              <Snowflake size={16} strokeWidth={2} /> заморозка
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-gold' : 'w-1.5 bg-cream/20'
            }`}
          />
        ))}
      </div>

      <button
        onClick={next}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium flex items-center justify-center gap-2 transition-transform active:scale-95"
      >
        {isLast ? 'Создать первую привычку' : 'Далее'}
        {!isLast && <ArrowRight size={16} />}
      </button>
    </div>
  )
}
