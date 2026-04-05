import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        medexText: 'var(--medex-text)',
        medexSidebar: 'var(--medex-sidebar)',
        medexMain: 'var(--medex-main)',
        medexInspector: 'var(--medex-inspector)',
        medexCard: 'var(--medex-card)',
        medexToolbar: 'var(--medex-toolbar)',
        medexBorder: 'var(--medex-border)',
        medexBorderLight: 'var(--medex-border-light)',
        medexHover: 'var(--medex-hover)',
        medexActive: 'var(--medex-active)',
        medexSelected: 'var(--medex-selected)',
        medexInputBg: 'var(--medex-input-bg)',
        medexInputBorder: 'var(--medex-input-border)',
        medexTagBg: 'var(--medex-tag-bg)',
        medexTagHover: 'var(--medex-tag-hover)',
        medexButtonBg: 'var(--medex-button-bg)',
        medexButtonHover: 'var(--medex-button-hover)',
        medexOverlay: 'var(--medex-overlay)',
        medexFavorite: 'var(--medex-favorite)',
        medexHighlight: 'var(--medex-highlight)',
        medexProgress: 'var(--medex-progress)'
      }
    }
  },
  plugins: []
};

export default config;
