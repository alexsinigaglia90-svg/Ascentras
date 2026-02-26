import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#060d16',
        panel: 'rgba(15, 26, 42, 0.9)',
        borderline: 'rgba(134, 177, 226, 0.3)',
        accent: '#78b8ff'
      },
      boxShadow: {
        panel: '0 22px 50px rgba(1, 6, 14, 0.56)'
      }
    }
  },
  plugins: []
} satisfies Config;
