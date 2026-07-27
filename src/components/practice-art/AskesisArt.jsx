export default function AskesisArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Левая часть разорванной линии */}
      <path
        d="
          M18 103
          C39 102 57 102 73 101
          C82 101 88 99 94 94
        "
        stroke="rgba(245,245,245,0.82)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Правая часть */}
      <path
        d="
          M107 106
          C113 101 120 100 128 100
          C145 101 163 101 182 100
        "
        stroke="rgba(245,245,245,0.82)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* След прежней связи */}
      <path
        d="
          M29 91
          C57 76 79 75 96 87
        "
        stroke="rgba(245,245,245,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
        strokeLinecap="round"
      />

      <path
        d="
          M108 116
          C129 126 150 124 171 111
        "
        stroke="rgba(245,245,245,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
        strokeLinecap="round"
      />

      {/* Слабые траектории вокруг разрыва */}
      <path
        d="M94 94L85 84"
        stroke="rgba(245,245,245,0.34)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <path
        d="M107 106L117 116"
        stroke="rgba(245,245,245,0.34)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Узлы */}
      <circle
        cx="54"
        cy="102"
        r="2.4"
        fill="rgba(245,245,245,0.46)"
      />

      <circle
        cx="147"
        cy="101"
        r="2.4"
        fill="rgba(245,245,245,0.46)"
      />

      {/* Точка сознательного выбора */}
      <circle
        cx="101"
        cy="100"
        r="6.5"
        fill="#D9B45B"
      />

      <circle
        cx="101"
        cy="100"
        r="12"
        stroke="rgba(217,180,91,0.16)"
        strokeWidth="1"
      />
    </svg>
  )
}