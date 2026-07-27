export default function FocusArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ========================================================
          FOCUS

          Всё пространство сходится к одной точке.
          Кольца — уровни внимания.
          Золото — текущий объект фокуса.
         ======================================================== */}

      {/* Внешняя пунктирная зона */}
      <circle
        cx="110"
        cy="80"
        r="57"
        stroke="rgba(230,230,230,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Основное кольцо */}
      <circle
        cx="110"
        cy="80"
        r="45"
        stroke="rgba(230,230,230,0.82)"
        strokeWidth="1.35"
      />

      {/* Второе кольцо */}
      <circle
        cx="110"
        cy="80"
        r="32"
        stroke="rgba(230,230,230,0.42)"
        strokeWidth="1"
      />

      {/* Внутреннее кольцо */}
      <circle
        cx="110"
        cy="80"
        r="19"
        stroke="rgba(230,230,230,0.28)"
        strokeWidth="1"
      />

      {/* Горизонтальная ось */}
      <path
        d="M 42 80 H 94"
        stroke="rgba(230,230,230,0.34)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <path
        d="M 126 80 H 178"
        stroke="rgba(230,230,230,0.34)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Вертикальная ось */}
      <path
        d="M 110 20 V 64"
        stroke="rgba(230,230,230,0.22)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      <path
        d="M 110 96 V 140"
        stroke="rgba(230,230,230,0.22)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Диагональные направления */}
      <path
        d="M 70 40 L 98 68"
        stroke="rgba(230,230,230,0.18)"
        strokeWidth="1"
      />

      <path
        d="M 150 40 L 122 68"
        stroke="rgba(230,230,230,0.18)"
        strokeWidth="1"
      />

      <path
        d="M 70 120 L 98 92"
        stroke="rgba(230,230,230,0.18)"
        strokeWidth="1"
      />

      <path
        d="M 150 120 L 122 92"
        stroke="rgba(230,230,230,0.18)"
        strokeWidth="1"
      />

      {/* ========================================================
          SYSTEM NODES
         ======================================================== */}

      <circle
        cx="110"
        cy="35"
        r="2.2"
        fill="rgba(230,230,230,0.48)"
      />

      <circle
        cx="155"
        cy="80"
        r="2.2"
        fill="rgba(230,230,230,0.56)"
      />

      <circle
        cx="110"
        cy="125"
        r="2.2"
        fill="rgba(230,230,230,0.42)"
      />

      <circle
        cx="65"
        cy="80"
        r="2.2"
        fill="rgba(230,230,230,0.52)"
      />

      {/* ========================================================
          FOCUS POINT
         ======================================================== */}

      <circle
        cx="110"
        cy="80"
        r="6"
        fill="#EDBD60"
      />

      <circle
        cx="110"
        cy="80"
        r="10"
        stroke="rgba(237,189,96,0.22)"
        strokeWidth="1"
      />
    </svg>
  )
}