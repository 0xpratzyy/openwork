/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#111111',
          sidebar: '#1a1a1a',
          border: '#222222',
          hover: '#1e1e1e',
        },
      },
    },
  },
  plugins: [],
};
