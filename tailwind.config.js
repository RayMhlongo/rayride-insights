export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        ink: '#1e293b',
        mist: '#f8fafc',
        line: '#e2e8f0',
        cyan: '#00d7ff',
        violet: '#7c3aed',
        night: '#09091f',
        nightPanel: '#12172b',
        success: '#15803d',
        danger: '#b91c1c',
        warning: '#b45309',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
        glow: '0 0 28px rgba(0, 215, 255, 0.18)',
      },
    },
  },
  plugins: [],
};
