export default function FocusArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Внешнее золотое кольцо */}
      <circle
        cx="100"
        cy="100"
        r="62"
        stroke="rgba(237,189,96,0.48)"
        strokeWidth="1"
      />

      {/* Корпус таймера */}
      <circle
        cx="100"
        cy="105"
        r="38"
        stroke="rgba(230,230,230,0.58)"
        strokeWidth="1.7"
      />

      {/* Верхняя кнопка */}
      <path
        d="M89 57 H111"
        stroke="rgba(230,230,230,0.48)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M100 57 V66"
        stroke="rgba(230,230,230,0.48)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Боковая кнопка */}
      <path
        d="M127 72 L134 65"
        stroke="rgba(230,230,230,0.42)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Стрелка таймера */}
      <path
        d="M100 105 L119 84"
        stroke="rgba(230,230,230,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Центральная точка */}
      <circle
        cx="100"
        cy="105"
        r="6"
        fill="#EDBD60"
      />
    </svg>
  )
}