/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-blue": "#000029",
        "light-blue": "#2b72e1",
        "accent-blue": "#157AFF",
        "nav-dark": "#0C2A4B",
        "nav-light": "#0E2E53",
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
