import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050a12',
        panel: 'rgba(15, 24, 39, 0.9)',
        borderline: 'rgba(156, 192, 234, 0.24)',
        accent: '#6fa6df'
      },
      boxShadow: {
        panel: '0 20px 44px rgba(2, 7, 14, 0.5)'
      }
    }
  },
  plugins: []
} satisfies Config;
