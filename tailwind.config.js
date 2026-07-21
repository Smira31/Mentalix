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
      },
      animation: {
        'fade-in': 'fadeIn 0.28s ease-out',
        'pulse-once': 'pulseOnce 0.32s ease-out',
      },
    },
  },
  plugins: [],
}
