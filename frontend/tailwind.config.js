/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#151e33',
          'blue-dark': '#0d1322',
          'blue-light': '#212d4a',
          pink: '#ff6ef6',
          'pink-hover': '#f555ea',
          'pink-light': '#fff0fd',
          canvas: '#f8fafc',
          card: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'clean-sm': '0 1px 2px 0 rgba(21, 30, 51, 0.04)',
        'clean-md': '0 4px 12px 0 rgba(21, 30, 51, 0.06), 0 1px 3px 0 rgba(21, 30, 51, 0.04)',
        'clean-lg': '0 10px 25px -3px rgba(21, 30, 51, 0.08), 0 4px 10px -2px rgba(21, 30, 51, 0.04)',
        'pink-subtle': '0 4px 14px 0 rgba(255, 110, 246, 0.25)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
