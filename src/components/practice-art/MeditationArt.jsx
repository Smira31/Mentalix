export default function MeditationArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ========================================================
          MEDITATION

          Тишина как постепенно затухающая волна.
          Центр остаётся стабильным,
          а внешняя активность растворяется.
         ======================================================== */}

      {/* Внешняя пунктирная зона */}
      <ellipse
        cx="110"
        cy="80"
        rx="68"
        ry="42"
        stroke="rgba(230,230,230,0.14)"
        strokeWidth="1"
        strokeDasharray="3 6"
      />

      {/* Верхняя волна */}
      <path
        d="
          M 42 70
          C 60 54, 78 52, 93 65
          C 104 74, 116 74, 127 65
          C 143 52, 161 54, 178 70
        "
        stroke="rgba(230,230,230,0.58)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Средняя волна */}
      <path
        d="
          M 52 82
          C 68 70, 83 69, 96 78
          C 105 84, 115 84, 124 78
          C 138 69, 153 70, 168 82
        "
        stroke="rgba(230,230,230,0.38)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Нижняя волна */}
      <path
        d="
          M 62 94
          C 75 86, 88 86, 99 92
          C 106 96, 114 96, 121 92
          C 132 86, 145 86, 158 94
        "
        stroke="rgba(230,230,230,0.22)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Едва заметная центральная ось */}
      <path
        d="
          M 110 43
          V 117
        "
        stroke="rgba(230,230,230,0.10)"
        strokeWidth="1"
        strokeDasharray="2 5"
      />

      {/* Боковые узлы */}
      <circle
        cx="70"
        cy="70"
        r="2.2"
        fill="rgba(230,230,230,0.42)"
      />

      <circle
        cx="150"
        cy="70"
        r="2.2"
        fill="rgba(230,230,230,0.42)"
      />

      <circle
        cx="82"
        cy="91"
        r="2"
        fill="rgba(230,230,230,0.28)"
      />

      <circle
        cx="138"
        cy="91"
        r="2"
        fill="rgba(230,230,230,0.28)"
      />

      {/* Центральная точка спокойствия */}
      <circle
        cx="110"
        cy="80"
        r="6"
        fill="#EDBD60"
      />

      {/* Тонкий ореол */}
      <circle
        cx="110"
        cy="80"
        r="10"
        stroke="rgba(237,189,96,0.20)"
        strokeWidth="1"
      />
    </svg>
  )
}