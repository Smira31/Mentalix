export default function BreathingArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ========================================================
          BREATHING

          Два пересекающихся цикла:
          вдох ↔ выдох.
          Центр — точка стабилизации.
         ======================================================== */}

      {/* Верхний цикл */}
      <ellipse
        cx="110"
        cy="66"
        rx="48"
        ry="36"
        stroke="rgba(230,230,230,0.88)"
        strokeWidth="1.35"
      />

      {/* Нижний цикл */}
      <ellipse
        cx="110"
        cy="96"
        rx="48"
        ry="36"
        stroke="rgba(230,230,230,0.62)"
        strokeWidth="1.2"
      />

      {/* Внешняя пунктирная система */}
      <ellipse
        cx="110"
        cy="81"
        rx="67"
        ry="49"
        stroke="rgba(230,230,230,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Внутренняя линия вдоха */}
      <path
        d="
          M 70 82
          C 82 68, 96 65, 110 79
          C 124 93, 139 91, 151 77
        "
        stroke="rgba(230,230,230,0.34)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Внутренняя линия выдоха */}
      <path
        d="
          M 74 89
          C 87 77, 98 79, 110 91
          C 122 103, 136 102, 147 91
        "
        stroke="rgba(230,230,230,0.22)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Центральная ось */}
      <path
        d="
          M 110 45
          V 117
        "
        stroke="rgba(230,230,230,0.14)"
        strokeWidth="1"
        strokeDasharray="2 5"
      />

      {/* Узлы дыхательного цикла */}
      <circle
        cx="82"
        cy="81"
        r="2.2"
        fill="rgba(230,230,230,0.48)"
      />

      <circle
        cx="139"
        cy="81"
        r="2.2"
        fill="rgba(230,230,230,0.48)"
      />

      {/* Центральная золотая точка */}
      <circle
        cx="110"
        cy="81"
        r="6"
        fill="#EDBD60"
      />

      {/* Тонкий ореол */}
      <circle
        cx="110"
        cy="81"
        r="10"
        stroke="rgba(237,189,96,0.20)"
        strokeWidth="1"
      />
    </svg>
  )
}