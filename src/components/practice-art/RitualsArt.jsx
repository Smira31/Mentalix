export default function RitualsArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ========================================================
          RITUALS

          Повторение, циклы, орбиты, устойчивость.
          Все линии принадлежат одной системе.
         ======================================================== */}

      {/* Внешняя пунктирная орбита */}
      <ellipse
        cx="110"
        cy="78"
        rx="76"
        ry="45"
        transform="rotate(-8 110 78)"
        stroke="rgba(230,230,230,0.22)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Большая основная орбита */}
      <ellipse
        cx="110"
        cy="78"
        rx="69"
        ry="42"
        transform="rotate(10 110 78)"
        stroke="rgba(230,230,230,0.88)"
        strokeWidth="1.35"
      />

      {/* Вторая орбита */}
      <ellipse
        cx="110"
        cy="78"
        rx="58"
        ry="33"
        transform="rotate(-18 110 78)"
        stroke="rgba(230,230,230,0.48)"
        strokeWidth="1"
      />

      {/* Внутренняя орбита */}
      <ellipse
        cx="110"
        cy="78"
        rx="43"
        ry="25"
        transform="rotate(7 110 78)"
        stroke="rgba(230,230,230,0.32)"
        strokeWidth="1"
      />

      {/* Глубокая внутренняя траектория */}
      <ellipse
        cx="110"
        cy="78"
        rx="29"
        ry="17"
        transform="rotate(-12 110 78)"
        stroke="rgba(230,230,230,0.20)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Дополнительная вертикальная орбита */}
      <ellipse
        cx="110"
        cy="78"
        rx="31"
        ry="67"
        transform="rotate(58 110 78)"
        stroke="rgba(230,230,230,0.30)"
        strokeWidth="1"
      />

      {/* Ещё одна тонкая пересекающая орбита */}
      <ellipse
        cx="110"
        cy="78"
        rx="37"
        ry="70"
        transform="rotate(73 110 78)"
        stroke="rgba(230,230,230,0.16)"
        strokeWidth="1"
      />

      {/* ========================================================
          SYSTEM NODES
         ======================================================== */}

      <circle
        cx="48"
        cy="76"
        r="2.4"
        fill="rgba(230,230,230,0.72)"
      />

      <circle
        cx="78"
        cy="43"
        r="2.2"
        fill="rgba(230,230,230,0.48)"
      />

      <circle
        cx="144"
        cy="47"
        r="2.5"
        fill="rgba(230,230,230,0.64)"
      />

      <circle
        cx="168"
        cy="82"
        r="2.3"
        fill="rgba(230,230,230,0.70)"
      />

      <circle
        cx="139"
        cy="111"
        r="2.4"
        fill="rgba(230,230,230,0.58)"
      />

      <circle
        cx="81"
        cy="111"
        r="2.1"
        fill="rgba(230,230,230,0.42)"
      />

      {/* ========================================================
          GOLD FOCUS
         ======================================================== */}

      {/* Центральная точка */}
      <circle
        cx="110"
        cy="78"
        r="6"
        fill="#EDBD60"
      />

      {/* Очень тонкое кольцо вокруг центра */}
      <circle
        cx="110"
        cy="78"
        r="10"
        stroke="rgba(237,189,96,0.22)"
        strokeWidth="1"
      />

      {/* Активная точка на внешнем цикле */}
      <circle
        cx="169"
        cy="77"
        r="5"
        fill="#EDBD60"
      />
    </svg>
  )
}