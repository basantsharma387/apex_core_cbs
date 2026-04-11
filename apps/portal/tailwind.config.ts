import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Customer portal — pure white, clean, private banking feel
        page:        '#FFFFFF',
        surface:     '#F8FAFC',
        border:      '#E2E8F0',
        borderMed:   '#CBD5E1',
        divider:     '#F1F5F9',
        ink:         '#0F172A',
        sub:         '#475569',
        muted:       '#94A3B8',
        action:      '#2563EB',
        actionHover: '#1D4ED8',
        actionLight: '#EFF6FF',
        ok:   { DEFAULT: '#15803D', bg: '#F0FDF4' },
        warn: { DEFAULT: '#B45309', bg: '#FFFBEB' },
        risk: { DEFAULT: '#B91C1C', bg: '#FEF2F2' },
      },
      borderRadius: {
        card:  '12px',
        pill:  '999px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['12px', { lineHeight: '18px' }],
        base:  ['14px', { lineHeight: '22px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['20px', { lineHeight: '30px' }],
      },
    },
  },
  plugins: [],
}
export default config
