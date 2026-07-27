export default function MeditationArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >

      {/* Outer system */}
      <circle
        cx="100"
        cy="97"
        r="62"
        stroke="rgba(230,230,230,0.20)"
        strokeWidth="1"
        strokeDasharray="4 6"
      />


      {/* Rings */}
      <circle
        cx="100"
        cy="97"
        r="45"
        stroke="rgba(230,230,230,0.58)"
        strokeWidth="1.2"
      />


      <circle
        cx="100"
        cy="97"
        r="30"
        stroke="rgba(230,230,230,0.38)"
        strokeWidth="1"
      />


      <circle
        cx="100"
        cy="97"
        r="17"
        stroke="rgba(230,230,230,0.55)"
        strokeWidth="1.1"
      />


      {/* Focus */}
      <circle
        cx="100"
        cy="97"
        r="6"
        fill="#EDBD60"
      />


      {/* Small gold orbit */}
      <circle
        cx="100"
        cy="97"
        r="10"
        stroke="rgba(237,189,96,0.18)"
        strokeWidth="1"
      />

    </svg>
  )
}