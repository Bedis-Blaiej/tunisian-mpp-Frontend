/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: '#010A10', // Rich Black
          light: '#211D21',   // Aurora Black
        },
        chalk: '#FFFBF2',      // Aesthetic White
        flag: '#C10206',       // Guardsman Red
        floodlight: '#A50113', // Madder
        ink: '#010A10',        // Rich Black
        mist: '#DFE2DB',       // Pale Powder
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        score: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        ticket: '16px',
      },
    },
  },
  plugins: [],
}
