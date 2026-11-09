/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#151e33',
          'navy-dark': '#0d1322',
          'navy-light': '#1e2942',
          magenta: '#ff63f6',
          'magenta-hover': '#ff2ef3',
          'magenta-light': '#fff0fe',
          white: '#ffffff',
          canvas: '#f8fafc',
          card: '#ffffff',
          // Backwards compatibility aliases
          blue: '#151e33',
          'blue-dark': '#0d1322',
          'blue-light': '#1e2942',
          pink: '#ff63f6',
          'pink-hover': '#ff2ef3',
          'pink-light': '#fff0fe',
        },
      },
      fontFamily: {
        sans: ['"Open Sans"', 'Open Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'clean-sm': '0 1px 3px 0 rgba(21, 30, 51, 0.05)',
        'clean-md': '0 4px 16px 0 rgba(21, 30, 51, 0.06), 0 1px 3px 0 rgba(21, 30, 51, 0.04)',
        'clean-lg': '0 12px 32px -4px rgba(21, 30, 51, 0.08), 0 4px 12px -2px rgba(21, 30, 51, 0.04)',
        'stitch-glow': '0 0 25px -2px rgba(255, 99, 246, 0.35)',
        'stitch-subtle': '0 4px 16px 0 rgba(255, 99, 246, 0.2)',
        'navy-elevated': '0 16px 40px -8px rgba(21, 30, 51, 0.25)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
};
