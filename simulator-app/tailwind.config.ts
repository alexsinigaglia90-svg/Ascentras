import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#f6f2ea',
        panel: 'rgba(255, 250, 243, 0.9)',
        borderline: 'rgba(23, 58, 93, 0.14)',
        accent: '#2f5f8a'
      },
      boxShadow: {
        panel: '0 12px 30px rgba(8, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
