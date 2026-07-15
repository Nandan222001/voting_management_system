/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50:  '#e6edfb',
          100: '#ccdcf7',
          200: '#99b9ef',
          300: '#6697e7',
          400: '#3374df',
          500: '#1a337e',
          600: '#1a337e',
          700: '#1a337e',
          800: '#002055',
          900: '#00102b',
          950: '#000815',
        },
        primary: {
          50:  '#e6edfb',
          100: '#ccdcf7',
          200: '#99b9ef',
          300: '#6697e7',
          400: '#3374df',
          500: '#1a337e',
          600: '#1a337e',
          700: '#1a337e',
          800: '#002055',
          900: '#00102b',
          950: '#000815',
        },
        secondary: {
          50:  '#f0f7ff',
          100: '#e0efff',
          200: '#badbff',
          300: '#94c7ff',
          400: '#6eb3ff',
          500: '#489fff',
          600: '#3a7fcc',
          700: '#2b5f99',
          800: '#1d3f66',
          900: '#0e2033',
          950: '#07101a',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
