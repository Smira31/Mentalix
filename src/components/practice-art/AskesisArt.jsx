export default function AskesisArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Единая линия слева */}
      <path
        d="M18 101
           C42 101 61 101 77 100
           C84 100 89 98 94 94"
        stroke="rgba(245,245,245,0.82)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Единая линия справа */}
      <path
        d="M106 106
           C111 102 116 100 123 100
           C140 101 159 101 182 101"
        stroke="rgba(245,245,245,0.82)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* След прежней связи */}
      <circle
        cx="100"
        cy="100"
        r="38"
        stroke="rgba(245,245,245,0.28)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Внутренние линии разрыва */}
      <path
        d="M94 94L82 87"
        stroke="rgba(245,245,245,0.36)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <path
        d="M106 106L118 113"
        stroke="rgba(245,245,245,0.36)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Смысловая точка — момент выбора */}
      <circle
        cx="100"
        cy="100"
        r="5.5"
        fill="#D9B45B"
      />

      {/* Слабое золотое кольцо */}
      <circle
        cx="100"
        cy="100"
        r="9"
        stroke="rgba(217,180,91,0.18)"
        strokeWidth="1"
      />
    </svg>
  )
}