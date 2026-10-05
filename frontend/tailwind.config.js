/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#5B5FEF', light: '#7C83FD', dark: '#4B4FC8' },
        accent: '#FFC857',
        cbg: '#F7F8FC',
        text: '#1F2937',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Prompt', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Prompt', 'Nunito', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
}
