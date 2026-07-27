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

        onOpen?.()
      }}
      className="
        relative
        w-full
        h-[174px]
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

      {/* ========================================================
          PROGRESS
         ======================================================== */}

      {right && (
        <span
          className="
            absolute
            top-[9px]
            right-[9px]
            z-10
            h-[28px]
            min-w-[42px]
            px-[9px]
            rounded-full
            flex
            items-center
            justify-center
            font-mono
            text-[11px]
            font-medium
            leading-none
            text-gold
            bg-gold/[0.025]
            border
            border-gold/[0.42]
          "
        >
          {right}
        </span>
      )}


      {/* ========================================================
          ART
         ======================================================== */}

      <div
        className="
          w-full
          h-[99px]
          px-[9px]
          pt-[7px]
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


      {/* ========================================================
          COPY
         ======================================================== */}

      <div
        className="
          flex-1
          w-full
          px-[13px]
          pb-[12px]
          flex
          flex-col
          justify-end
        "
      >
        <div
          className="
            font-display
            text-[15px]
            font-bold
            text-cream
            leading-[1.08]
            tracking-[-0.025em]
          "
        >
          {title}
        </div>


        <div
          className="
            text-[11px]
            text-cream/[0.48]
            font-normal
            mt-[5px]
            leading-[1.25]
            tracking-[-0.01em]
          "
        >
          {subtitle}
        </div>
      </div>
    </button>
  )
}