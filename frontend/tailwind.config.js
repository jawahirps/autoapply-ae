/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        uae: {
          red: '#EF4444',
          green: '#22C55E',
          black: '#1F2937',
          gold: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
}
