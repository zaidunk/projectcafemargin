/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/screens/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf8f3',
          100: '#f5efe6',
          200: '#e8d5bc',
          300: '#d4b08a',
          400: '#c8a882',
          500: '#b8895a',
          600: '#8b5e3c',
          700: '#5c3d2e',
          800: '#3d2419',
          900: '#2d1b10',
          950: '#1a0f08',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(92,61,46,0.07), 0 1px 2px rgba(92,61,46,0.05)',
        'card-lg': '0 4px 12px rgba(92,61,46,0.12)',
        'metric':  '0 8px 20px rgba(92,61,46,0.2)',
        'sidebar': '4px 0 24px rgba(0,0,0,0.15)',
        'glow':    '0 0 20px rgba(200,168,130,0.3)',
      },
    },
  },
  plugins: [],
}
