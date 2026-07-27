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
        min-h-[250px]
        rounded-[28px]
        bg-emerald
        overflow-hidden
        text-left
        border
        border-cream/[0.04]
        active:scale-[0.98]
        transition-transform
      "
    >
      {right && (
        <span
          className="
            absolute
            top-4
            right-4
            z-10
            font-mono
            text-[11px]
            leading-none
            text-gold
            bg-gold/[0.08]
            border
            border-gold/20
            rounded-full
            px-2.5
            py-2
          "
        >
          {right}
        </span>
      )}

      <div className="h-[158px] px-5 pt-4 flex items-center justify-center">
        <div className="w-full max-w-[154px] h-[150px]">
          {artwork}
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="font-display text-[20px] text-cream leading-[1.15]">
          {title}
        </div>

        <div className="text-[13px] text-cream/45 font-medium mt-1.5 leading-[1.4]">
          {subtitle}
        </div>
      </div>
    </button>
  )
}