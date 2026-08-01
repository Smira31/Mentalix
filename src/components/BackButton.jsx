import { ChevronLeft } from 'lucide-react'
import { platform } from '../platform'

/*
 * ЕДИНАЯ КНОПКА «НАЗАД»
 *
 * До этого каждый экран рисовал свою: где-то круглая иконка без
 * подписи, где-то стрелка в тексте, где-то ничего. Хуже того,
 * круглая кнопка на фоне карточки была почти чёрной на чёрном —
 * на «Теме недели» её физически не было видно, хотя в коде она
 * была.
 *
 * Здесь одна форма для всего приложения: видимая граница,
 * стрелка и слово. Слово важно — иконка без подписи в
 * полноэкранном режиме Telegram соседствует с его собственным
 * «Закрыть», и человек не понимает, куда именно он вернётся.
 */
export default function BackButton({
  onClick,
  label = 'Назад',
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={() => {
        platform.haptic('light')
        onClick?.()
      }}
      className={[
        'flex items-center gap-2 rounded-full border border-cream/15 bg-emerald',
        'pl-2.5 pr-4 py-2 active:scale-95 transition-transform shrink-0',
        className,
      ].join(' ')}
    >
      <ChevronLeft
        size={17}
        className="text-cream/70"
      />

      <span className="text-[13px] font-semibold text-cream/70">
        {label}
      </span>
    </button>
  )
}
