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
        h-[158px]
        rounded-[18px]
        bg-emerald
        overflow-hidden
        text-left
        border
        border-white/[0.16]
        active:scale-[0.985]
        transition-transform
        flex
        flex-col
      "
    >
      {/* Progress */}
      {right && (
        <span
          className="
            absolute
            top-[8px]
            right-[8px]
            z-20
            h-[26px]
            min-w-[40px]
            px-[8px]
            rounded-full
            flex
            items-center
            justify-center
            font-mono
            text-[11px]
            font-medium
            leading-none
            text-gold
            bg-black/30
            border
            border-gold/[0.42]
          "
        >
          {right}
        </span>
      )}

      {/* Illustration */}
      <div
        className="
          relative
          w-full
          h-[94px]
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
            inset-0
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

      {/* Text */}
      <div
        className="
          flex-1
          w-full
          px-[12px]
          pb-[10px]
          flex
          flex-col
          justify-end
          min-h-0
        "
      >
        <div
          className="
            font-display
            text-[15px]
            font-bold
            text-cream
            leading-[1.05]
            tracking-[-0.025em]
            whitespace-nowrap
          "
        >
          {title}
        </div>

        <div
          className="
            text-[11px]
            text-cream/[0.48]
            font-normal
            mt-[4px]
            leading-[1.2]
            tracking-[-0.01em]
            min-h-[26px]
          "
        >
          {subtitle}
        </div>
      </div>
    </button>
  )
}