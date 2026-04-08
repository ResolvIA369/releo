import type { Config } from 'tailwindcss'

function token(name: string) {
  return `rgb(var(${name}) / <alpha-value>)`
}

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token('--color-primary'),
          light: token('--color-primary-light'),
          dark: token('--color-primary-dark'),
        },
        secondary: {
          DEFAULT: token('--color-secondary'),
          light: token('--color-secondary-light'),
          dark: token('--color-secondary-dark'),
        },
        success: token('--color-success'),
        error: token('--color-error'),
        warning: token('--color-warning'),
        info: token('--color-info'),
        surface: token('--color-surface'),
        border: token('--color-border'),
        'on-primary': token('--color-on-primary'),
        'on-secondary': token('--color-on-secondary'),
        'text-base': token('--color-text'),
        'text-muted': token('--color-text-muted'),
        'doman-red': token('--color-doman-red'),
        'doman-black': token('--color-doman-black'),
      },
      spacing: {
        'spacing-1': 'var(--spacing-1)',
        'spacing-2': 'var(--spacing-2)',
        'spacing-3': 'var(--spacing-3)',
        'spacing-4': 'var(--spacing-4)',
        'spacing-5': 'var(--spacing-5)',
        'spacing-6': 'var(--spacing-6)',
        'spacing-8': 'var(--spacing-8)',
        'spacing-10': 'var(--spacing-10)',
        'spacing-12': 'var(--spacing-12)',
        'spacing-16': 'var(--spacing-16)',
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
      },
      fontFamily: {
        sans: 'var(--font-family-sans)',
        display: 'var(--font-family-display)',
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
    },
  },
  plugins: [],
}

export default config
