import { platform } from '../platform'

/*
 * soon — практика существует в коде, но ещё не готова
 * к продукту. Карточка остаётся на месте и остаётся
 * читаемой: человек видит, что раздел будет, но не
 * проваливается в незаконченный экран. Ничего не
 * удаляем — снять gating позже будет одной строкой.
 */
export default function PracticeCard({
  title,
  subtitle,
  right,
  artwork,
  artworkScale = 1,
  onOpen,
  soon = false,
}) {
  return (
    <button
      type="button"
      disabled={soon}
      aria-disabled={soon}
      onClick={() => {
        if (soon) return

        platform.haptic('light')
        onOpen?.()
      }}
      className={[
        'relative w-full h-[238px] rounded-[26px] bg-emerald overflow-hidden text-left border flex flex-col transition-transform',
        soon
          ? 'border-white/[0.06] cursor-default'
          : 'border-white/[0.10] active:scale-[0.985]',
      ].join(' ')}
    >
      {/* Скоро */}
      {soon && (
        <span
          className="
            absolute
            top-[12px]
            right-[12px]
            z-20
            h-[30px]
            px-[12px]
            rounded-full
            flex
            items-center
            justify-center
            text-[11px]
            font-bold
            uppercase
            tracking-wider
            leading-none
            text-cream/45
            bg-black/25
            border
            border-cream/[0.14]
          "
        >
          Скоро
        </span>
      )}

      {/* Прогресс */}
      {!soon && right && (
        <span
          className="
            absolute
            top-[12px]
            right-[12px]
            z-20
            h-[30px]
            min-w-[48px]
            px-[10px]
            rounded-full
            flex
            items-center
            justify-center
            font-mono
            text-[12px]
            font-medium
            leading-none
            text-gold
            bg-black/25
            border
            border-gold/[0.38]
          "
        >
          {right}
        </span>
      )}

      {/* Иллюстрация */}
      <div
        className={[
          'relative w-full h-[150px] shrink-0 overflow-hidden flex items-center justify-center',
          soon ? 'opacity-35' : '',
        ].join(' ')}
      >
        <div
          className="
            absolute
            inset-[8px]
            flex
            items-center
            justify-center
            origin-center
          "
          style={{
            transform: `scale(${artworkScale})`,
          }}
        >
          {artwork}
        </div>
      </div>

      {/* Текст */}
      <div
        className="
          flex-1
          w-full
          px-[18px]
          pb-[17px]
          flex
          flex-col
          justify-start
          min-h-0
        "
      >
        <div
          className={[
            'font-display text-[17px] font-bold leading-[1.12] tracking-[-0.025em]',
            soon ? 'text-cream/45' : 'text-cream',
          ].join(' ')}
        >
          {title}
        </div>

        <div
          className={[
            'text-[13px] font-normal mt-[8px] leading-[1.35] tracking-[-0.01em]',
            soon ? 'text-cream/[0.28]' : 'text-cream/[0.46]',
          ].join(' ')}
        >
          {subtitle}
        </div>
      </div>
    </button>
  )
}