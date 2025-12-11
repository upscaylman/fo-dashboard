/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem', // MD3 Large styling
      },
      colors: {
        // MD3 Baseline Colors inspired by FO Metaux brand but softer
        primary: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d9ff',
          600: '#2563eb', // Standard Blue
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        surface: {
          light: '#FDF8F6',
          DEFAULT: '#FFFFFF',
          variant: '#F0F1F6',
          dark: '#0f172a', // slate-900
        }
      },
      boxShadow: {
        'md3-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md3-md': '0 4px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'md3-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}