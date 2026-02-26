import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#120d0a',
        panel: 'rgba(33, 24, 19, 0.9)',
        borderline: 'rgba(233, 198, 154, 0.25)',
        accent: '#d2a56f'
      },
      boxShadow: {
        panel: '0 22px 50px rgba(5, 3, 2, 0.54)'
      }
    }
  },
  plugins: []
} satisfies Config;
