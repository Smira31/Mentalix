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
        display: ['Onest', 'Manrope', 'sans-serif'],
        body: ['Onest', 'Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        // появление: подъём + едва заметный масштаб
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.994)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // мягкое «раскрытие» вместо резкого щелчка
        bloom: {
          '0%': { opacity: '0', transform: 'scale(0.72)' },
          '55%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseOnce: {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        // золотое свечение выполненного — теплее и дольше
        glowPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(217,180,91,0)' },
          '35%': { boxShadow: '0 0 26px 6px rgba(217,180,91,0.28)' },
          '100%': { boxShadow: '0 0 0 0 rgba(217,180,91,0)' },
        },
        streakBounce: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.28)' },
          '70%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-once': 'pulseOnce 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'celebrate-pop': 'bloom 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'glow-pulse': 'glowPulse 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
        'streak-bounce': 'streakBounce 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
