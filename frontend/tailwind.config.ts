import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fdf001',
          foreground: '#100e22',
        },
        secondary: {
          DEFAULT: '#28243f',
          foreground: '#fffde7',
        },
        accent: {
          DEFAULT: '#34d6c3',
          foreground: '#100e22',
        },
        background: '#100e22',
        foreground: '#fffde7',
      },
      fontFamily: {
        sans: ['Zain', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
  plugins: [],
};

export default config;
