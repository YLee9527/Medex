import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        medexText: '#EAEAEA',
        medexSidebar: '#1E1E1E',
        medexMain: '#101010',
        medexInspector: '#1E1E1E'
      }
    }
  },
  plugins: []
};

export default config;
