/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        secondary: '#FF6B35', 
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
      }
    },
  },
  plugins: [],
}
