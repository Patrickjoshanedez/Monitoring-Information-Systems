/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B16A3', // purple from screenshots
          dark: '#3F0E73'
        },
        accent: '#7A2BCB'
      }
    }
  },
  plugins: []
};


