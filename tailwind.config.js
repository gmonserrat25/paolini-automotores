/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      keyframes: {
        // Slow drift across the hero plate, standing in for the original clip's motion
        heroPan: {
          '0%': { transform: 'scale(1.01) translate3d(-0.6%, 0.4%, 0)' },
          '100%': { transform: 'scale(1.06) translate3d(0.8%, -0.6%, 0)' },
        },
        heroSheen: {
          '0%, 65%, 100%': { opacity: '0', transform: 'translateX(-60%) skewX(-12deg)' },
          '82%': { opacity: '0.16' },
          '99%': { opacity: '0', transform: 'translateX(160%) skewX(-12deg)' },
        },
      },
      animation: {
        heroPan: 'heroPan 26s ease-in-out infinite alternate',
        heroSheen: 'heroSheen 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
