import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#081014',
        panel: '#101c22',
        line: '#263942',
        cyan: '#79d5df',
        lime: '#b8de79',
        amber: '#e9be6c',
        danger: '#f0787c',
      },
      fontFamily: {
        sans: ['"Fira Sans"', '"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
