export default function NeuroArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Профиль головы и шеи */}
      <path
        d="
          M67 169
          C54 155 47 135 48 112
          C49 82 62 58 84 47
          C103 38 126 39 143 50
          C159 61 166 78 163 94
          C161 104 156 112 150 118
          L157 126
          C160 130 158 134 152 135
          L143 136
          C141 148 134 158 123 164
          C113 170 103 171 94 168
          C84 165 76 166 67 169
        "
        stroke="rgba(245,245,245,0.82)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Линия шеи */}
      <path
        d="
          M94 168
          C93 178 91 184 87 189
        "
        stroke="rgba(245,245,245,0.46)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Нейросеть */}
      <path
        d="
          M69 87
          L86 67
          L108 65
          L129 76
          L140 96
          L134 116
          L116 130
          L93 128
          L75 112
          Z
        "
        stroke="rgba(245,245,245,0.34)"
        strokeWidth="1.1"
      />

      <path
        d="M86 67L116 130"
        stroke="rgba(245,245,245,0.22)"
        strokeWidth="1"
      />

      <path
        d="M108 65L75 112"
        stroke="rgba(245,245,245,0.22)"
        strokeWidth="1"
      />

      <path
        d="M129 76L93 128"
        stroke="rgba(245,245,245,0.22)"
        strokeWidth="1"
      />

      <path
        d="M69 87L134 116"
        stroke="rgba(245,245,245,0.22)"
        strokeWidth="1"
      />

      <path
        d="M140 96L75 112"
        stroke="rgba(245,245,245,0.18)"
        strokeWidth="1"
      />

      {/* Внешний контур активности */}
      <circle
        cx="104"
        cy="98"
        r="48"
        stroke="rgba(245,245,245,0.14)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Узлы */}
      <circle cx="69" cy="87" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="86" cy="67" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="108" cy="65" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="129" cy="76" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="140" cy="96" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="134" cy="116" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="116" cy="130" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="93" cy="128" r="2.8" fill="rgba(245,245,245,0.52)" />
      <circle cx="75" cy="112" r="2.8" fill="rgba(245,245,245,0.52)" />

      {/* Центральный активный узел */}
      <circle cx="104" cy="98" r="6.5" fill="#D9B45B" />

      <circle
        cx="104"
        cy="98"
        r="11"
        stroke="rgba(217,180,91,0.16)"
        strokeWidth="1"
      />
    </svg>
  )
}