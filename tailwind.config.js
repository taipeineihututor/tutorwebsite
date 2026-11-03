/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // TeachFormosa palette. The whole site uses these two scales, so changing
      // them here re-colours everything.
      colors: {
        // Accent: lime (500 and below are bright, for buttons and highlights on dark;
        // 600 and above are deep greens for text and selected states on white).
        emerald: {
          50: '#F2FADF',
          100: '#E4F4BE',
          200: '#D2EE92',
          300: '#D9F77F',
          400: '#C9F34F',
          500: '#B8EA32',
          600: '#2C7A58',
          700: '#1F5F44',
          800: '#174A37',
          900: '#0F3A2C',
          950: '#0A2A21',
        },
        // Neutrals with a slight forest-green tint instead of cold grey.
        slate: {
          50: '#F6F8F3',
          100: '#ECF0E7',
          200: '#DCE3D5',
          300: '#C0CCB8',
          400: '#8FA086',
          500: '#667762',
          600: '#4B5B48',
          700: '#344434',
          800: '#18453B',
          900: '#0F342C',
          950: '#08241F',
        },
      },
    },
  },
  plugins: [],
}
