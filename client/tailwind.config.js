/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        edu: ['"Edu SA Hand"','cursive'],
      },
      colors: {
        softRed: '#1e40af',
        'quiz-purple': '#f87171',
        brandBlue: '#6b21a8',
      },
    },
  },
  plugins: [],
}