/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: '#0B3D2E',
          light: '#124B39',
        },
        chalk: '#F5F3EC',
        flag: '#D2232A',
        floodlight: '#F2B705',
        ink: '#101820',
        mist: '#7C8B85',
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
