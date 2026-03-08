import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'rgb(15 23 42)',
          foreground: 'rgb(248 250 252)',
        },
        accent: {
          DEFAULT: 'rgb(37 99 235)',
          foreground: 'rgb(255 255 255)',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
