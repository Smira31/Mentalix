/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'emerald-deep': '#0E211D',
        'emerald': '#16332E',
        'emerald-light': '#274B43',
        'sage': '#5A8F76',
        'mint': '#96CDB0',
        'cognac': '#C18D52',
        'gold': '#B8952E',
        'cream': '#F3E9DD',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseOnce: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.015)' },
          '100%': { transform: 'scale(1)' },
        },
        celebratePop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.3)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(184,149,46,0)' },
          '40%': { boxShadow: '0 0 20px 4px rgba(184,149,46,0.35)' },
          '100%': { boxShadow: '0 0 0 0 rgba(184,149,46,0)' },
        },
        streakBounce: {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.5)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.28s ease-out',
        'pulse-once': 'pulseOnce 0.32s ease-out',
        'celebrate-pop': 'celebratePop 0.4s ease-out',
        'glow-pulse': 'glowPulse 0.7s ease-out',
        'streak-bounce': 'streakBounce 0.5s ease-out',
      },
    },
  },
  plugins: [],
}