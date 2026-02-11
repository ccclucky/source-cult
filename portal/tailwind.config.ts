import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cult: {
          bg: '#0a0a0f',
          'bg-alt': '#12121a',
          card: '#161620',
          'card-hover': '#1e1e2d',
          text: '#a09ca8',
          'text-light': '#d4d0dc',
          ink: '#f5f3f7',
          line: '#2a2a3c',
          'line-light': '#3a3a50',
          primary: '#7c3aed',
          secondary: '#a78bfa',
          accent: '#c084fc',
          gold: '#c2962b',
          'gold-light': '#d4a53a',
          'gold-dark': '#a67c2e'
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Cinzel', 'serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        script: ['var(--font-script)', 'Cinzel Decorative', 'serif']
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(194, 150, 43, 0.1), transparent)'
      }
    }
  },
  plugins: []
} satisfies Config;
