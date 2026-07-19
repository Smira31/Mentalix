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
        'cognac': '#A85C32',
        'gold': '#C9A227',
        'cream': '#F3E9DD',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
