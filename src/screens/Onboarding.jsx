import { useState } from 'react'
import { platform } from '../platform'

// ── Онбординг: три слайда в стиле stoic. — гора, суть, первый шаг ──

function MountainArt({ progress = 0.4 }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-[220px] mx-auto">
      <path d="M10 104 L70 34 L104 68 L134 22 L190 104" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" className="text-cream/50" />
      <path d="M10 104 H190" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-cream/50" />
      <circle cx={70 + progress * 60} cy={64 - progress * 30} r="5" className="fill-gold" />
      <path d="M126 16 a8 8 0 1 1 16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cream/50" />
    </svg>
  )
}

const SLIDES = [
  {
    eyebrow: 'Mentalix',
    title: 'Система, а не мотивация',
    text: 'Мотивация кончается. Система — нет. Mentalix держит твой день на ритуалах, аскезах и честном чек-ине, даже когда сил нет.',
    cta: 'Дальше',
    art: 0.15,
  },
  {
    eyebrow: 'Как это работает',
    title: 'Один шаг за раз',
    text: 'Никаких списков из десяти дел. Приложение показывает одно действие — самое важное сейчас. Сделал — идёшь дальше. Путь складывается из шагов.',
    cta: 'Дальше',
    art: 0.45,
  },
  {
    eyebrow: 'Твой путь начинается',
    title: 'Срыв — не конец',
    text: 'Пропустил день — Путь не сгорает. Возвращаешься и делаешь один маленький шаг. Здесь не осуждают. Здесь продолжают.',
    cta: 'Начать путь',
    art: 0.75,
  },
]

export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1
  const slide = SLIDES[index]

  function next() {
    platform.haptic(isLast ? 'medium' : 'light')
    if (isLast) onFinish()
    else setIndex((i) => i + 1)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-emerald-deep flex flex-col animate-fade-in">
      <div className="flex justify-end px-5 pt-5">
        {!isLast && (
          <button
            onClick={() => { platform.haptic('light'); onFinish() }}
            className="text-[13px] font-semibold text-cream/35 bg-transparent border-0 px-2 py-1"
          >
            Пропустить
          </button>
        )}
      </div>

      <div key={index} className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        <div className="mb-10">
          <MountainArt progress={slide.art} />
        </div>
        <div className="text-[13px] text-cream/40 font-semibold mb-2">{slide.eyebrow}</div>
        <h2 className="font-display text-[28px] text-cream leading-tight max-w-sm">{slide.title}</h2>
        <p className="text-[15px] text-cream/50 mt-4 leading-relaxed max-w-sm">{slide.text}</p>
      </div>

      <div className="flex flex-col items-center gap-5 pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-gold' : 'bg-cream/15'}`} />
          ))}
        </div>
        <button onClick={next} className="cta-pill text-[16px] px-14 py-4">
          {slide.cta}
        </button>
      </div>
    </div>
  )
}
