/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors:{
        "primary": "#010851",
        "secondary": "#9A7AF1",
        "tartiary": "#707070",
        "pink": "#EE9AE5",
        "lgreen":"#4CBB17",
        "green": "#008000	"
      },
      boxShadow: {
        '3xl': '0px 10px 50px 0px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}