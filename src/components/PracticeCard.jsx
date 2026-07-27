import { platform } from '../platform'

export default function PracticeCard({
  title,
  subtitle,
  right,
  artwork,
  onOpen,
}) {
  return (
    <button
      type="button"
      onClick={() => {
        platform.haptic('light')
        onOpen()
      }}
      className="
        relative
        w-full
        min-h-[226px]
        rounded-[16px]
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
      {/* Прогресс: 4/4, 1/1 */}
      {right && (
        <span
          className="
            absolute
            top-[10px]
            right-[10px]
            z-10
            h-[30px]
            min-w-[44px]
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
            bg-gold/[0.03]
            border
            border-gold/[0.42]
          "
        >
          {right}
        </span>
      )}

      {/* Иллюстрация */}
      <div
        className="
          w-full
          h-[132px]
          px-[12px]
          pt-[8px]
          flex
          items-center
          justify-center
          shrink-0
        "
      >
        <div
          className="
            w-full
            h-full
            flex
            items-center
            justify-center
          "
        >
          {artwork}
        </div>
      </div>

      {/* Текст */}
      <div
        className="
          flex-1
          w-full
          px-[14px]
          pb-[16px]
          pt-[5px]
          flex
          flex-col
          justify-end
        "
      >
        <div
          className="
            font-display
            text-[17px]
            font-bold
            text-cream
            leading-[1.15]
            tracking-[-0.025em]
          "
        >
          {title}
        </div>

        <div
          className="
            text-[13px]
            text-cream/[0.52]
            font-normal
            mt-[7px]
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