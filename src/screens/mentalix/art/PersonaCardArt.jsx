function GoldFocus({ x, y }) {
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r="10"
        stroke="rgba(237,189,96,0.22)"
        strokeWidth="1"
      />

      <circle
        cx={x}
        cy={y}
        r="6"
        fill="#EDBD60"
      />
    </>
  )
}


function ListenerCardArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="110"
        cy="80"
        rx="75"
        ry="47"
        stroke="rgba(230,230,230,0.16)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      <circle
        cx="72"
        cy="80"
        r="29"
        stroke="rgba(230,230,230,0.78)"
        strokeWidth="1.35"
      />

      <circle
        cx="148"
        cy="80"
        r="29"
        stroke="rgba(230,230,230,0.78)"
        strokeWidth="1.35"
      />

      <circle
        cx="72"
        cy="80"
        r="19"
        stroke="rgba(230,230,230,0.28)"
        strokeWidth="1"
      />

      <circle
        cx="148"
        cy="80"
        r="19"
        stroke="rgba(230,230,230,0.28)"
        strokeWidth="1"
      />

      <path
        d="M 28 80 C 47 58, 57 58, 72 80 C 87 102, 96 102, 110 80 C 124 58, 133 58, 148 80 C 163 102, 174 102, 192 80"
        stroke="rgba(230,230,230,0.48)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <path
        d="M 72 51 V 109 M 148 51 V 109"
        stroke="rgba(230,230,230,0.14)"
        strokeWidth="1"
        strokeDasharray="2 5"
      />

      <path
        d="M 92 66 C 101 72, 104 75, 110 80 C 116 85, 119 88, 128 94"
        stroke="rgba(230,230,230,0.34)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <circle cx="72" cy="80" r="2.5" fill="rgba(230,230,230,0.76)" />
      <circle cx="148" cy="80" r="2.5" fill="rgba(230,230,230,0.76)" />
      <circle cx="48" cy="80" r="2" fill="rgba(230,230,230,0.40)" />
      <circle cx="172" cy="80" r="2" fill="rgba(230,230,230,0.40)" />

      <GoldFocus x="110" y="80" />
    </svg>
  )
}


function MentorCardArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 27 129 C 56 119, 72 124, 96 113 C 120 102, 136 84, 155 56 C 169 35, 181 29, 194 27"
        stroke="rgba(230,230,230,0.16)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      <path
        d="M 29 131 H 62 V 115 H 91 V 96 H 120 V 76 H 151 V 51"
        stroke="rgba(230,230,230,0.88)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 22 141 C 59 132, 93 136, 126 120 C 157 105, 177 81, 196 48"
        stroke="rgba(230,230,230,0.28)"
        strokeWidth="1"
      />

      <path
        d="M 34 149 C 74 144, 109 148, 145 132 C 168 122, 184 108, 198 87"
        stroke="rgba(230,230,230,0.16)"
        strokeWidth="1"
      />

      <path
        d="M 151 51 V 24 M 151 24 H 181"
        stroke="rgba(230,230,230,0.34)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      <circle cx="62" cy="115" r="2.3" fill="rgba(230,230,230,0.48)" />
      <circle cx="91" cy="96" r="2.3" fill="rgba(230,230,230,0.56)" />
      <circle cx="120" cy="76" r="2.3" fill="rgba(230,230,230,0.66)" />

      <circle
        cx="151"
        cy="51"
        r="18"
        stroke="rgba(230,230,230,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      <GoldFocus x="151" y="51" />
    </svg>
  )
}


function PathfinderCardArt() {
  return (
    <svg
      viewBox="0 0 220 160"
      className="w-full h-full"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 24 127 C 52 113, 72 119, 94 101 C 115 84, 129 91, 148 73 C 164 58, 180 60, 197 39"
        stroke="rgba(230,230,230,0.78)"
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      <path
        d="M 25 94 C 50 76, 75 82, 94 101 C 113 120, 137 118, 160 99 C 174 88, 186 85, 199 88"
        stroke="rgba(230,230,230,0.22)"
        strokeWidth="1"
      />

      <path
        d="M 43 137 L 43 55 M 94 137 L 94 37 M 148 123 L 148 27 M 197 105 L 197 26"
        stroke="rgba(230,230,230,0.12)"
        strokeWidth="1"
        strokeDasharray="2 5"
      />

      <path
        d="M 64 117 C 70 102, 80 96, 94 101 C 109 106, 119 102, 128 90"
        stroke="rgba(230,230,230,0.38)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      <path
        d="M 123 55 H 136 M 123 55 V 68 M 173 55 H 160 M 173 55 V 68 M 123 105 H 136 M 123 105 V 92 M 173 105 H 160 M 173 105 V 92"
        stroke="rgba(230,230,230,0.56)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      <circle cx="43" cy="118" r="2.3" fill="rgba(230,230,230,0.38)" />
      <circle cx="68" cy="113" r="2.3" fill="rgba(230,230,230,0.48)" />
      <circle cx="94" cy="101" r="2.5" fill="rgba(230,230,230,0.58)" />
      <circle cx="122" cy="88" r="2.4" fill="rgba(230,230,230,0.50)" />
      <circle cx="174" cy="60" r="2.4" fill="rgba(230,230,230,0.58)" />
      <circle cx="197" cy="39" r="2.2" fill="rgba(230,230,230,0.42)" />

      <circle
        cx="148"
        cy="73"
        r="24"
        stroke="rgba(230,230,230,0.16)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      <GoldFocus x="148" y="73" />
    </svg>
  )
}


export default function PersonaCardArt({
  persona,
}) {
  if (persona === 'mayak') {
    return <ListenerCardArt />
  }

  if (persona === 'kompas') {
    return <MentorCardArt />
  }

  return <PathfinderCardArt />
}
