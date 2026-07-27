import { platform } from '../platform'

export default function PracticeCard({
  title,
  subtitle,
  right,
  artwork,
  artworkScale = 1,
  onOpen,
}) {
  return (
    <button
      type="button"
      onClick={() => {
        platform.haptic('light')
        onOpen?.()
      }}
      className="
        relative
        w-full
        h-[238px]
        rounded-[26px]
        bg-emerald
        overflow-hidden
        text-left
        border
        border-white/[0.10]
        active:scale-[0.985]
        transition-transform
        flex
        flex-col
      "
    >
      {/* Прогресс */}
      {right && (
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
        className="
          relative
          w-full
          h-[150px]
          shrink-0
          overflow-hidden
          flex
          items-center
          justify-center
        "
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
          className="
            font-display
            text-[17px]
            font-bold
            text-cream
            leading-[1.12]
            tracking-[-0.025em]
          "
        >
          {title}
        </div>

        <div
          className="
            text-[13px]
            text-cream/[0.46]
            font-normal
            mt-[8px]
            leading-[1.35]
            tracking-[-0.01em]
          "
        >
          {subtitle}
        </div>
      </div>
    </button>
  )
}