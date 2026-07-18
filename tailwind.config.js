export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        emerald: {
          deep: "#0E211D",
          DEFAULT: "#16332E",
          light: "#274B43",
        },
        cognac: {
          DEFAULT: "#A85C32",
          light: "#C97E4E",
        },
        cream: "#F3E9DD",
        gold: "#C9A227",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
