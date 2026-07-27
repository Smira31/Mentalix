export default function AskesisArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ========================================================
          ASKESIS

          Линия привычного движения разрывается в центре.
          Золотая точка — момент сознательного выбора.
         ======================================================== */}

      {/* Пунктирная орбита вокруг точки выбора */}
      <ellipse
        cx="110"
        cy="80"
        rx="42"
        ry="34"
        stroke="rgba(230,230,230,0.20)"
        strokeWidth="1"
        strokeDasharray="4 6"
      />

      {/* Входящая линия */}
      <path
        d="
          M 18 80
          H 63
          C 76 80, 84 78, 91 73
          C 98 68, 101 67, 104 67
        "
        stroke="rgba(230,230,230,0.90)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Верхняя ветвь перед отказом */}
      <path
        d="
          M 63 80
          C 76 79, 87 73, 97 65
        "
        stroke="rgba(230,230,230,0.38)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Нижняя ветвь перед отказом */}
      <path
        d="
          M 63 80
          C 77 82, 87 87, 98 94
        "
        stroke="rgba(230,230,230,0.30)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Небольшой разрыв слева от центра */}
      <path
        d="
          M 99 70
          C 103 73, 105 76, 106 79
        "
        stroke="rgba(230,230,230,0.62)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Выход после точки выбора */}
      <path
        d="
          M 116 80
          C 120 80, 123 76, 128 73
          C 134 69, 140 69, 148 72
          C 158 76, 166 80, 176 80
          H 202
        "
        stroke="rgba(230,230,230,0.90)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Верхняя ветвь после выбора */}
      <path
        d="
          M 122 75
          C 132 67, 143 65, 154 68
        "
        stroke="rgba(230,230,230,0.30)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Нижняя ветвь после выбора */}
      <path
        d="
          M 121 85
          C 132 94, 143 96, 155 92
        "
        stroke="rgba(230,230,230,0.24)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* ========================================================
          SMALL SYSTEM NODES
         ======================================================== */}

      <circle
        cx="55"
        cy="80"
        r="2.2"
        fill="rgba(230,230,230,0.52)"
      />

      <circle
        cx="164"
        cy="78"
        r="2.2"
        fill="rgba(230,230,230,0.48)"
      />

      {/* ========================================================
          GOLD CHOICE
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
        stroke="rgba(237,189,96,0.20)"
        strokeWidth="1"
      />
    </svg>
  )
}