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
        brand: {
          background: '#F5F6F4',
          primary: '#17211D',
          accent: '#0C6B4A',
          secondary: '#0A5740',
          muted: '#5C6B63',
          alarm: '#B33527',
          hairline: '#DFE4E0',
        },
      },
      fontFamily: {
        display: ['Charter', 'Bitstream Charter', 'Sitka Text', 'Cambria', 'Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Inter', 'sans-serif'],
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
