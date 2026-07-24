/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        nmb: {
          accent: '#aa3bff',
          'accent-light': '#c084fc',
          bg: '#fff',
          'bg-dark': '#16171d',
          surface: '#f9fafb',
          'surface-dark': '#1f2028',
          border: '#e5e4e7',
          'border-dark': '#2e303a',
          text: '#6b6375',
          'text-dark': '#9ca3af',
          'text-h': '#08060d',
          'text-h-dark': '#f3f4f6',
        },
      },
    },
  },
  plugins: [],
}
