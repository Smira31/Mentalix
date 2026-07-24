/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Семантика темы. Старые имена сохранены, чтобы не переписывать
        // все экраны: они автоматически перекрашиваются в монохром + золото.
        'emerald-deep':  'rgb(var(--c-bg) / <alpha-value>)',    // фон
        'emerald':       'rgb(var(--c-card) / <alpha-value>)',  // карточка
        'emerald-light': 'rgb(var(--c-card2) / <alpha-value>)', // карточка-2
        'cream':         'rgb(var(--c-text) / <alpha-value>)',  // текст
        'sage':          'rgb(var(--c-text) / <alpha-value>)',  // → монохром
        'mint':          'rgb(var(--c-text) / <alpha-value>)',  // → монохром
        'gold':          'rgb(var(--c-gold) / <alpha-value>)',  // акцент
        'cognac':        'rgb(var(--c-gold) / <alpha-value>)',  // → золото
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
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
          '0%': { boxShadow: '0 0 0 0 rgba(217,180,91,0)' },
          '40%': { boxShadow: '0 0 20px 4px rgba(217,180,91,0.3)' },
          '100%': { boxShadow: '0 0 0 0 rgba(217,180,91,0)' },
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
