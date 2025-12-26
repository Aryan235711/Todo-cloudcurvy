/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    files: [
      './index.html',
      './App.tsx',
      './index.tsx',
      './components/**/*.{ts,tsx}',
      './hooks/**/*.{ts,tsx}',
      './services/**/*.{ts,tsx}',
      './constants.tsx',
      './types.ts'
    ],
    options: {
      safelist: [
        // Dynamic priority colors
        'bg-emerald-400', 'bg-amber-400', 'bg-rose-500',
        'text-emerald-500', 'text-amber-600', 'text-rose-500',
        'border-emerald-100', 'border-amber-100', 'border-rose-100',
        // Animation classes
        'animate-pulse', 'animate-spin',
        // Dynamic state classes
        'opacity-70', 'scale-105', 'shadow-xl'
      ]
    }
  },
  theme: {
    extend: {
      // Only include used animations
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
};
