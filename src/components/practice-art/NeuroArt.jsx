export default function BreathingArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Верхний цикл */}
      <circle
        cx="100"
        cy="75"
        r="42"
        stroke="rgba(245,245,245,0.72)"
        strokeWidth="1.6"
      />

      {/* Нижний цикл */}
      <circle
        cx="100"
        cy="125"
        r="42"
        stroke="rgba(245,245,245,0.42)"
        strokeWidth="1.35"
      />

      {/* Внешний ритм */}
      <ellipse
        cx="100"
        cy="100"
        rx="50"
        ry="74"
        stroke="rgba(245,245,245,0.16)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Внутренний поток */}
      <path
        d="
          M100 40
          C87 58 87 73 100 88
          C113 103 113 118 100 136
          C91 148 90 158 94 168
        "
        stroke="rgba(245,245,245,0.28)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Боковые траектории */}
      <path
        d="M64 73C78 82 87 90 100 100"
        stroke="rgba(245,245,245,0.20)"
        strokeWidth="1"
        strokeDasharray="2 5"
        strokeLinecap="round"
      />

      <path
        d="M136 127C122 118 113 110 100 100"
        stroke="rgba(245,245,245,0.20)"
        strokeWidth="1"
        strokeDasharray="2 5"
        strokeLinecap="round"
      />

      {/* Узлы */}
      <circle cx="100" cy="75" r="2.7" fill="rgba(245,245,245,0.50)" />
      <circle cx="100" cy="125" r="2.7" fill="rgba(245,245,245,0.36)" />

      {/* Центр дыхательного цикла */}
      <circle cx="100" cy="100" r="6.5" fill="#D9B45B" />

      <circle
        cx="100"
        cy="100"
        r="11"
        stroke="rgba(217,180,91,0.16)"
        strokeWidth="1"
      />
    </svg>
  )
}