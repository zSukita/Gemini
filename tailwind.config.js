/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rpg: {
          dark: "#0f1117",
          darker: "#090a0f",
          card: "#161922",
          cardHover: "#1d212d",
          border: "#2b3145",
          gold: "#d4af37",
          goldLight: "#f3e5ab",
          goldDark: "#997d1e",
          crimson: "#9b111e",
          crimsonLight: "#e63946",
          parchment: "#f4ede0",
          parchmentDark: "#e2d5be",
        }
      },
      fontFamily: {
        serif: ['"Cinzel"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
