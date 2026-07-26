import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { Plus, X, Sparkles, Shield, Wind, MessageCircle } from 'lucide-react'

// ── Кнопка «+» в стиле stoic.: раскрывается стопкой действий ──
// Сложность спрятана, пока она не нужна: на главной одна кнопка,
// по тапу — короткий список того, что можно сделать прямо сейчас.

function Item({ Icon, label, hint, onClick, delay, open }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-full bg-cream text-emerald-deep px-5 py-3.5 flex items-center gap-3 border-0 active:scale-[0.97]"
      style={{
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.94)',
        transition: `opacity 260ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 260ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="flex-1 text-left">
        <span className="block text-[15px] font-bold leading-tight">{label}</span>
        {hint && <span className="block text-[11.5px] font-semibold opacity-50">{hint}</span>}
      </span>
    </button>
  )
}

export default function QuickAdd({ onCheckin, onPractice, onMentor }) {
  const [open, setOpen] = useState(false)

  // закрытие по «назад» на Android и по Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function pick(fn) {
    platform.haptic('medium')
    setOpen(false)
    setTimeout(fn, 160)
  }

  const items = [
    { Icon: MessageCircle, label: 'Поговорить', hint: 'наставник, собеседник, следопыт', onClick: () => pick(onMentor) },
    { Icon: Wind, label: 'Подышать', hint: 'минута, чтобы утихло', onClick: () => pick(() => onPractice('breathing')) },
    { Icon: Shield, label: 'Отметить аскезу', hint: 'честно, как есть', onClick: () => pick(() => onPractice('ascezas')) },
    { Icon: Sparkles, label: 'Закрыть ритуал', hint: 'один шаг сейчас', onClick: () => pick(() => onPractice('rituals')) },
    { Icon: Plus, label: 'Чек-ин', hint: 'как ты на самом деле', onClick: () => pick(onCheckin) },
  ]

  return (
    <>
      {/* затемнение */}
      <div
        onClick={() => { platform.haptic('light'); setOpen(false) }}
        className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-[2px]"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 300ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />

      {/* стопка действий */}
      <div
        className="fixed left-0 right-0 z-[56] px-8 max-w-md mx-auto flex flex-col gap-2.5"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 152px)', pointerEvents: open ? 'auto' : 'none' }}
      >
        {items.map((it, i) => (
          <Item key={it.label} {...it} open={open} delay={open ? i * 40 : (items.length - i) * 25} />
        ))}
      </div>

      {/* сама кнопка */}
      <button
        onClick={() => { platform.haptic('light'); setOpen((v) => !v) }}
        aria-label={open ? 'Закрыть' : 'Быстрое действие'}
        className="fixed left-1/2 z-[57] w-14 h-14 rounded-full bg-cream text-emerald-deep flex items-center justify-center border-0 active:scale-90 transition-transform"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 88px)',
          transform: `translateX(-50%) rotate(${open ? 135 : 0}deg)`,
          transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
        }}
      >
        {open ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
      </button>
    </>
  )
}
