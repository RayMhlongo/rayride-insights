export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        ink: '#1e293b',
        mist: '#f8fafc',
        line: '#e2e8f0',
        success: '#15803d',
        danger: '#b91c1c',
        warning: '#b45309',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
