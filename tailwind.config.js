import fluid, { extract, screens, fontSize } from 'fluid-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-mode="dark"]'],
  content: {
    files: [
      './components/**/*.{vue,js,ts,jsx,tsx}',
      './layouts/**/*.{vue,js,ts,jsx,tsx}',
      './pages/**/*.{vue,js,ts,jsx,tsx}',
      './app.vue',
    ],
    extract,
  },
  theme: {
    screens,
    fontSize,
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'sans-serif'],
      },
      screens: {
        '1.5xl': '86.25rem',
      },
    },
  },
  plugins: [fluid],
};
