import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: '#0B0D0E',
          900: '#14181B',
          850: '#1B2125',
          800: '#232A2F',
        },
        bone: '#F4F2EC',
        ash: '#9BA4A8',
        bullion: {
          DEFAULT: '#E3A82B',
          deep: '#B9861F',
          pale: '#F3CD6E',
        },
        allow: '#34D399',
        block: '#F87171',
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        ledger: '68rem',
      },
    },
  },
  plugins: [],
}
export default config
