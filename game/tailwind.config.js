/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-text': '#F2F4F8',
        'game-accent': '#4589FF',
        'game-primary': '#21272A',
        'game-card': '#121619',
      }
    },
  },
  plugins: [],
}

