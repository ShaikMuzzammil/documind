import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Custom surface colors ──────────────────── */
        'bg-primary':    'var(--bg-primary)',
        'bg-secondary':  'var(--bg-secondary)',
        'bg-card':       'var(--bg-card)',
        'bg-hover':      'var(--bg-hover)',
        /* ── Text ───────────────────────────────────── */
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        /* ── Borders ────────────────────────────────── */
        border:          'var(--border-color)',
        /* ── Brand accents ──────────────────────────── */
        accent:          'var(--accent)',
        'accent-light':  'var(--accent-light)',
        'accent-2':      'var(--accent-2)',
        /* ── Semantic ───────────────────────────────── */
        success:  'var(--success)',
        danger:   'var(--danger)',
        warning:  'var(--warning)',
      },
      fontFamily: {
        sans: ['ui-sans-serif','system-ui','-apple-system','BlinkMacSystemFont','sans-serif'],
        mono: ['ui-monospace','SFMono-Regular','Menlo','monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        shimmer:   'shimmer 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
