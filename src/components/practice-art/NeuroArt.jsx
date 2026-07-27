export default function NeuroArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Контур головы */}
      <path
        d="
          M72 166
          C56 153 47 132 48 107
          C49 78 65 55 89 46
          C113 37 139 44 153 63
          C163 76 165 92 157 105
          C154 110 151 114 149 117
          L156 126
          C159 130 157 134 151 134
          L143 134
          C141 149 132 160 116 164
        "
        stroke="rgba(245,245,245,0.82)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Сеть */}
      <path
        d="M73 86L90 68L113 72L132 90L127 112L106 123L82 112L73 86Z"
        stroke="rgba(245,245,245,0.34)"
        strokeWidth="1.1"
      />

      <path
        d="M90 68L106 123M113 72L82 112M73 86L127 112M132 90L82 112"
        stroke="rgba(245,245,245,0.22)"
        strokeWidth="1"
      />

      {/* Внешний контур сети */}
      <circle
        cx="103"
        cy="96"
        r="42"
        stroke="rgba(245,245,245,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Узлы */}
      <circle cx="73" cy="86" r="3" fill="rgba(245,245,245,0.55)" />
      <circle cx="90" cy="68" r="3" fill="rgba(245,245,245,0.55)" />
      <circle cx="113" cy="72" r="3" fill="rgba(245,245,245,0.55)" />
      <circle cx="132" cy="90" r="3" fill="rgba(245,245,245,0.55)" />
      <circle cx="127" cy="112" r="3" fill="rgba(245,245,245,0.55)" />
      <circle cx="106" cy="123" r="3" fill="rgba(245,245,245,0.55)" />
      <circle cx="82" cy="112" r="3" fill="rgba(245,245,245,0.55)" />

      {/* Центральный активный узел */}
      <circle cx="104" cy="95" r="6.5" fill="#D9B45B" />

      <circle
        cx="104"
        cy="95"
        r="11"
        stroke="rgba(217,180,91,0.16)"
        strokeWidth="1"
      />
    </svg>
  )
}