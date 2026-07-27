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
