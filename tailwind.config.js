/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        illusion: {
          black: '#0a0a0a',
          white: '#ffffff',
          pink: '#f5a3bb',
          blush: '#fcc8d9',
        },
      },
      fontFamily: {
        heading: [
          '"Minion Variable Concept"',
          '"Minion Pro"',
          '"Playfair Display"',
          'serif',
        ],
        body: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -18px rgba(10, 10, 10, 0.35)',
        card: '0 18px 40px -30px rgba(10, 10, 10, 0.35)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
}
