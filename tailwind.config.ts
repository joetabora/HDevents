import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './modules/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f7f7f5',
        panel: '#ffffff',
        primary: '#0f766e',
        ink: '#1f2937'
      }
    }
  },
  plugins: []
};

export default config;
