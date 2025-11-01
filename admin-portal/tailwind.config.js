/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f14',       // near-black
        surface: '#111827',  // dark slate
        muted: '#1f2937',    // slate
        text: '#e5e7eb',     // gray-200
        subtext: '#9ca3af',  // gray-400
        primary: '#22c55e',  // green
        info: '#3b82f6',     // blue
        warn: '#f59e0b',     // yellow
        danger: '#ef4444',   // red
        border: '#2a3340',
      },
      boxShadow: {
        glow: '0 0 12px rgba(34,197,94,0.7)',
        glowBlue: '0 0 10px rgba(59,130,246,0.7)',
      },
      backgroundImage: {
        'radial-dark': 'radial-gradient(1200px_800px_at_10%_10%,#0c121a_0%,#0b0f14_50%)',
      },
    },
  },
  plugins: [],
}
