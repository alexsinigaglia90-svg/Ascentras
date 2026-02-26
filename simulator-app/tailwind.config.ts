import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070b12',
        panel: 'rgba(15, 24, 38, 0.58)',
        borderline: 'rgba(173, 201, 240, 0.24)',
        accent: '#7ba2d8'
      },
      boxShadow: {
        panel: '0 18px 36px rgba(0, 0, 0, 0.34)'
      }
    }
  },
  plugins: []
} satisfies Config;
