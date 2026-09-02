/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070B14',
          900: '#0A0F1D',
          800: '#0E1426',
          700: '#151C33',
        },
        surface: {
          dark: '#0E1416',
          panel: 'rgba(22, 29, 30, 0.75)',
          elevated: 'rgba(47, 54, 56, 0.65)',
        },
        cyan: {
          glow: '#22D3EE',
          light: '#8AEBFF',
        },
        amber: {
          glow: '#FBBF24',
          neon: '#FFC640',
        },
        flag: {
          red: '#F87171',
          rose: '#FB7185',
        }
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px rgba(34, 211, 238, 0.35)',
        'cyan-glow-lg': '0 0 40px rgba(34, 211, 238, 0.6)',
        'amber-glow': '0 0 25px rgba(251, 191, 36, 0.4)',
        'red-glow': '0 0 20px rgba(248, 113, 113, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 2s linear infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
