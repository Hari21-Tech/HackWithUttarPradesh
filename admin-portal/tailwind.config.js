/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // toggle with <html class="dark">
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',   // include TS if you add later
    './src/**/**/*.{js,jsx,ts,tsx}',// deep scans (optional but safe)
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        md: '1.25rem',
        lg: '2rem',
        xl: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
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
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      ringOffsetColor: {
        slate: '#020617',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'scale-in': { '0%': { transform: 'scale(.98)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'scale-in': 'scale-in .12s ease-out',
      },
    },
  },

  // Classes referenced conditionally in the Parking page that Tailwind might purge
  safelist: [
    // rings/offsets
    'ring-2', 'ring-1', 'ring-inset', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-950',
    // status colors
    'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-slate-500',
    'text-emerald-300', 'text-rose-300', 'text-amber-200', 'text-slate-200',
    'bg-emerald-500/10', 'ring-emerald-500/40',
    'bg-rose-500/10', 'ring-rose-500/40',
    'bg-amber-500/15', 'ring-amber-500/40',
    'bg-zinc-500/20', 'ring-zinc-500/40', 'text-zinc-300',
  ],

  plugins: [
    // add '@tailwindcss/forms' or '@tailwindcss/typography' if you want
  ],
};
