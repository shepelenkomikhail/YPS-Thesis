/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  important: '#root',
  plugins: [],
  darkMode: 'selector',
  corePlugins: {
       preflight: false,
  }
}

