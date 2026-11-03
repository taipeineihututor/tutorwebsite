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
      // TeachFormosa palette: deep blue + yellow. The whole site uses these two
      // scales, so changing them here re-colours everything.
      colors: {
        // Accent: yellow for buttons and highlights on dark blue (300-500),
        // royal blue for selected states and text on white (600-900).
        emerald: {
          50: '#FFF9DB',
          100: '#FFF0AD',
          200: '#FFE680',
          300: '#FFE36B',
          400: '#FFD93D',
          500: '#FFCE1F',
          600: '#2F4FD0',
          700: '#243FA8',
          800: '#1B3183',
          900: '#142468',
          950: '#0D1A4D',
        },
        // Neutrals with a slight blue tint instead of cold grey.
        slate: {
          50: '#F5F7FC',
          100: '#EAEFF8',
          200: '#D8E0F0',
          300: '#B9C6E3',
          400: '#8797BF',
          500: '#5E6F9A',
          600: '#435377',
          700: '#2E3C60',
          800: '#1C3076',
          900: '#122164',
          950: '#0A1745',
        },
      },
    },
  },
  plugins: [],
}
