/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        sapphire: {
          50: '#f0f4f9',
          100: '#dbe6f2',
          200: '#b9d0e6',
          300: '#8cb2d5',
          400: '#5a8fc0',
          500: '#3972ab',
          600: '#265991',
          700: '#1d4674',
          800: '#173a60',
          900: '#0a2540',
          950: '#06182a',
        },
        civic: {
          50: '#f0f4f9',
          100: '#dbe6f2',
          200: '#b9d0e6',
          300: '#8cb2d5',
          400: '#5a8fc0',
          500: '#3972ab',
          600: '#265991',
          700: '#1d4674',
          800: '#173a60',
          900: '#0a2540',
          950: '#06182a',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.12)',
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
