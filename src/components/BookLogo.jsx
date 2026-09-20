export default function BookLogo({ size = 64, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 180"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {/* Open book and the two loose pages beneath it. */}
        <path d="M18 42C51 34 82 37 112 56V151C82 132 51 128 18 136L30 54C32 47 36 44 42 43Z" />
        <path d="M112 56C142 37 173 34 206 42L222 136C189 128 158 132 112 151V56Z" />
        <path d="M18 136C52 128 83 132 112 151C81 139 49 140 20 148L11 157C43 149 79 151 112 168" />
        <path d="M222 136C189 128 158 132 112 151C143 139 176 140 220 148L229 157C196 149 160 151 112 168" />
        <path d="M112 56V151" />

        {/* Page lines. */}
        <path d="M35 70C55 64 76 66 95 76" />
        <path d="M32 91C53 85 74 88 96 98" />
        <path d="M129 76C149 66 170 64 190 70" />
        <path d="M128 98C150 88 171 85 192 91" />

        {/* Feather. */}
        <path d="M174 48C193 56 207 70 211 88C215 108 208 125 195 141L183 151C188 128 184 105 178 85C174 71 171 58 174 48Z" />
        <path d="M174 48C181 68 190 91 195 141" />
        <path d="M181 69L194 78" />
        <path d="M185 91L201 103" />
        <path d="M190 112L207 124" />

        {/* Octagonal inkwell and diamond highlight. */}
        <path d="M183 143L194 138H211L222 143L226 164L215 174H190L179 164L183 143Z" />
        <ellipse cx="202.5" cy="141" rx="12" ry="5" />
        <path d="M197 141C199 144 206 144 208 141" />
        <path d="M202.5 153L207 160L202.5 167L198 160L202.5 153Z" />
      </g>
    </svg>
  )
}

export const BOOK_LOGO_VIEWBOX = '0 0 240 180'
