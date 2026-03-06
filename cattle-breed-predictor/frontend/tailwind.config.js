/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        forest: "#1a2e1a",
        amber: "#d4852a",
        cream: "#f5f0e8",
        bark: "#3d2b1f",
        sage: "#4a7c59"
      }
    }
  },
  plugins: []
}
