/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#0f172a', // slate-900
          light: '#f8fafc', // slate-50
          accent: '#0ea5e9', // sky-500
        }
      }
    },
  },
  plugins: [],
}
