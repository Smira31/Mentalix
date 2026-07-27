export default function RitualsArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Внешняя орбита */}
      <ellipse
        cx="100"
        cy="100"
        rx="72"
        ry="38"
        transform="rotate(-14 100 100)"
        stroke="rgba(245,245,245,0.24)"
        strokeWidth="1.2"
      />

      {/* Средняя орбита */}
      <ellipse
        cx="100"
        cy="100"
        rx="60"
        ry="46"
        transform="rotate(18 100 100)"
        stroke="rgba(245,245,245,0.42)"
        strokeWidth="1.35"
      />

      {/* Внутренняя орбита */}
      <ellipse
        cx="100"
        cy="100"
        rx="43"
        ry="61"
        transform="rotate(-42 100 100)"
        stroke="rgba(245,245,245,0.72)"
        strokeWidth="1.6"
      />

      {/* Дополнительная траектория */}
      <path
        d="M35 117
           C54 79 82 58 116 61
           C144 63 162 80 169 104
           C174 121 166 138 150 149"
        stroke="rgba(245,245,245,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
        strokeLinecap="round"
      />

      {/* Внутренний ритм */}
      <path
        d="M50 91
           C69 71 91 66 111 76
           C129 85 139 103 136 120
           C132 139 116 150 96 147"
        stroke="rgba(245,245,245,0.20)"
        strokeWidth="1"
        strokeDasharray="2 5"
        strokeLinecap="round"
      />

      {/* Узлы системы */}
      <circle cx="47" cy="100" r="2.5" fill="rgba(245,245,245,0.54)" />
      <circle cx="70" cy="67" r="2.3" fill="rgba(245,245,245,0.44)" />
      <circle cx="128" cy="68" r="2.6" fill="rgba(245,245,245,0.58)" />
      <circle cx="154" cy="112" r="2.4" fill="rgba(245,245,245,0.42)" />
      <circle cx="118" cy="145" r="2.5" fill="rgba(245,245,245,0.50)" />

      {/* Смысловой центр */}
      <circle cx="101" cy="99" r="6.5" fill="#D9B45B" />

      {/* Мягкий золотой ореол */}
      <circle
        cx="101"
        cy="99"
        r="12"
        stroke="rgba(217,180,91,0.16)"
        strokeWidth="1"
      />

      {/* Ещё один тонкий виток */}
      <ellipse
        cx="100"
        cy="100"
        rx="28"
        ry="70"
        transform="rotate(52 100 100)"
        stroke="rgba(245,245,245,0.16)"
        strokeWidth="1"
      />
    </svg>
  )
}