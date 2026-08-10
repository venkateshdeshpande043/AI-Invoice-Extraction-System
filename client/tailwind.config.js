/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm neutral scale — replaces the default gray so the entire app
        // re-themes to a warm, paper-like feel without touching every class.
        gray: {
          50: '#FAF8F4',
          100: '#F3EFE8',
          200: '#E5DED0',
          300: '#D2C8B4',
          400: '#B4A88F',
          500: '#95886C',
          600: '#786B51',
          700: '#5D523D',
          800: '#443B2B',
          900: '#2C2519',
          950: '#1E1810',
        },
        // Primary action / emphasis scale (warm espresso-brown)
        primary: {
          50: '#F8F4EC',
          100: '#EFE6D4',
          200: '#DFCDA8',
          300: '#C9AE7C',
          400: '#B08C55',
          500: '#8F6C3E',
          600: '#6E4F2C',
          700: '#553B21',
          800: '#3F2B18',
          900: '#2A1D10',
        },
        cream: '#FAF6EF',
        ivory: '#F4EEE2',
        beige: '#EAE0CD',
        sand: '#D8CBB1',
        taupe: '#B3A284',
        mocha: '#7A6649',
        brown: '#5C4A33',
        espresso: '#2E2519',
        rust: '#A4572E',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(46, 37, 25, 0.05), 0 2px 8px -2px rgba(46, 37, 25, 0.06)',
        lift: '0 8px 24px -8px rgba(46, 37, 25, 0.16)',
      },
    },
  },
  plugins: [],
};
