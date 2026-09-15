/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Jost', 'Futura', 'ui-sans-serif', 'sans-serif'],
        wordmark: ['Saira', 'Eurostile', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
