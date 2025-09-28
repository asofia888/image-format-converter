/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#007BFF',
        'brand-secondary': '#6C757D',
        'brand-success': '#28A745',
        'brand-danger': '#DC3545',
        'brand-light': '#F8F9FA',
        'brand-dark': '#343A40',
      },
    },
  },
  plugins: [],
}