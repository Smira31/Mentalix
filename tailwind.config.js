/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Семантика темы. Старые имена сохранены, чтобы не переписывать
        // все экраны: они автоматически перекрашиваются в монохром + золото.
        'emerald-deep': 'rgb(var(--c-bg) / <alpha-value>)', // фон
        emerald: 'rgb(var(--c-card) / <alpha-value>)', // карточка
        'emerald-light': 'rgb(var(--c-card2) / <alpha-value>)', // карточка-2
        cream: 'rgb(var(--c-text) / <alpha-value>)', // текст

        // Шкала текста. Прозрачность больше не заменяет иерархию:
        // cream 15.1:1 → muted 5.69:1 → faint 3.55:1 (только крупный).
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',

        sage: 'rgb(var(--c-text) / <alpha-value>)', // → монохром
        mint: 'rgb(var(--c-text) / <alpha-value>)', // → монохром
        gold: 'rgb(var(--c-gold) / <alpha-value>)', // акцент
        cognac: 'rgb(var(--c-gold) / <alpha-value>)', // → золото

        // Подложка под иллюстрации. Тёмная в обеих темах —
        // см. комментарий у --c-artbed в index.css.
        artbed: 'rgb(var(--c-artbed) / <alpha-value>)',
      },
      fontFamily: {
        // Onest — шрифт из дизайн-системы Mentalix.
        // До этого в коде стоял Manrope, расхождение
        // тянулось с самого начала проекта.
        display: ['Onest', 'sans-serif'],
        body: ['Onest', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        // Появление без сдвига layout: движение целого экрана дёргается в WKWebView.
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
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
        'fade-in': 'fadeIn 0.22s ease-out both',
        'pulse-once': 'pulseOnce 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'celebrate-pop': 'bloom 0.52s cubic-bezier(0.32, 0.72, 0, 1) both',
        'glow-pulse': 'glowPulse 1.1s cubic-bezier(0.32, 0.72, 0, 1)',
        'streak-bounce': 'streakBounce 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
