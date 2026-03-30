/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary (orange accent)
        'primary':                     '#FF702E',
        'primary-fixed':               '#ffdfd1',
        'primary-fixed-dim':           '#FF702E',
        'primary-container':           '#FF702E',
        'on-primary':                  '#381700',
        'on-primary-container':        '#562100',
        'on-primary-fixed':            '#210b00',
        'on-primary-fixed-variant':    '#512000',
        'inverse-primary':             '#6b2c00',
        'surface-tint':                '#FF702E',

        // Secondary
        'secondary':                   '#c4c5d6',
        'secondary-container':         '#434654',
        'secondary-fixed':             '#e0e1f3',
        'secondary-fixed-dim':         '#c4c5d6',
        'on-secondary':                '#2d303d',
        'on-secondary-container':      '#b2b4c5',
        'on-secondary-fixed':          '#181b27',
        'on-secondary-fixed-variant':  '#434654',

        // Tertiary
        'tertiary':                    '#d5d7e5',
        'tertiary-container':          '#b9bbc9',
        'tertiary-fixed':              '#e0e2f0',
        'tertiary-fixed-dim':          '#c4c6d3',
        'on-tertiary':                 '#2d303b',
        'on-tertiary-container':       '#484b56',
        'on-tertiary-fixed':           '#181b25',
        'on-tertiary-fixed-variant':   '#444652',

        // Surface hierarchy
        'background':                  '#111319',
        'surface':                     '#111319',
        'surface-dim':                 '#111319',
        'surface-bright':              '#373940',
        'surface-container-lowest':    '#0c0e14',
        'surface-container-low':       '#191b22',
        'surface-container':           '#1e1f26',
        'surface-container-high':      '#282a30',
        'surface-container-highest':   '#33343b',
        'surface-variant':             '#33343b',
        'inverse-surface':             '#e2e2eb',
        'inverse-on-surface':          '#2e3037',

        // On-surface
        'on-surface':                  '#e2e2eb',
        'on-surface-variant':          '#cababa',
        'on-background':               '#e2e2eb',

        // Outline
        'outline':                     '#948d85',
        'outline-variant':             '#4a3e3b',

        // Error
        'error':                       '#ffb4ab',
        'error-container':             '#93000a',
        'on-error':                    '#690005',
        'on-error-container':          '#ffdad6',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Space Grotesk', 'sans-serif'],
        mono:     ['Space Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        full:    '9999px',
      },
    },
  },
  plugins: [],
}
