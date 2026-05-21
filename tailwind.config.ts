import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#fafbf7',
        ink: '#18181b',
        muted: '#686f68',
        soft: '#929991',
        line: '#e2e6df',
        accent: '#0f766e',
        accentSoft: '#e4f5f1',
      },
      fontFamily: {
        sans: [
          'Geist',
          'Satoshi',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        product: '0 40px 90px -64px rgba(24, 24, 27, 0.65)',
      },
    },
  },
  plugins: [],
} satisfies Config;
