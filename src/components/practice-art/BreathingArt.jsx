export default function BreathingArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Основные циклы дыхания */}
      <circle
        cx="78"
        cy="100"
        r="46"
        stroke="rgba(245,245,245,0.82)"
        strokeWidth="1.6"
      />

      <circle
        cx="122"
        cy="100"
        r="46"
        stroke="rgba(245,245,245,0.42)"
        strokeWidth="1.35"
      />

      {/* Внешний ритм */}
      <circle
        cx="100"
        cy="100"
        r="64"
        stroke="rgba(245,245,245,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Внутренний поток */}
      <path
        d="M48 100C64 86 79 82 100 100C121 118 136 114 152 100"
        stroke="rgba(245,245,245,0.28)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Дополнительные узлы */}
      <circle cx="78" cy="100" r="2.8" fill="rgba(245,245,245,0.50)" />
      <circle cx="122" cy="100" r="2.8" fill="rgba(245,245,245,0.34)" />

      {/* Центр цикла */}
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