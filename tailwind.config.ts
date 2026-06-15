import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#111118',
        card: '#16161F',
        border: 'rgba(255,255,255,0.07)',
        'border-hover': 'rgba(255,255,255,0.14)',
        moixa: '#00FFD1',
        mantle: '#6C5CE7',
        'win-green': '#00FF87',
        'loss-red': '#FF4444',
        warn: '#F59E0B',
        text: '#FFFFFF',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'fluid-h1': 'clamp(3rem, 8vw, 6.5rem)',
        'fluid-h2': 'clamp(2rem, 5vw, 3.5rem)',
        'fluid-h3': 'clamp(1.5rem, 3vw, 2.25rem)',
      },
      letterSpacing: {
        tightish: '-0.02em',
      },
      maxWidth: {
        container: '1280px',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        'glow': 'glow 2.4s ease-in-out infinite',
        'flicker': 'flicker 4s linear infinite',
        'scroll-x': 'scrollX 40s linear infinite',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.9)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 24px rgba(0,255,209,0.20)' },
          '50%': { boxShadow: '0 0 48px rgba(0,255,209,0.45)' },
        },
        flicker: {
          '0%, 18%, 22%, 25%, 53%, 57%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.6' },
        },
        scrollX: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'moixa-gradient': 'linear-gradient(135deg, #00FFD1 0%, #6C5CE7 100%)',
        'moixa-radial': 'radial-gradient(circle at top, rgba(0,255,209,0.12), transparent 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
