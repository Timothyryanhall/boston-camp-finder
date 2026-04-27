/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        sand: {
          50: '#fbf8f3',
          100: '#f3ece2',
          200: '#e8dccb',
          700: '#6f5a4b',
          900: '#2a211b',
        },
      },
      boxShadow: {
        card: '0 18px 50px rgba(42, 33, 27, 0.08)',
      },
    },
  },
  plugins: [],
};
