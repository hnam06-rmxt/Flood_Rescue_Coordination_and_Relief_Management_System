/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'sans-serif'],
      },
      colors: {
        primary: { 
          DEFAULT: '#6366f1', 
          pressed: '#4f46e5', 
          deep: '#3730a3' 
        },
        'brand-navy': { 
          DEFAULT: '#0b1120', 
          deep: '#020617', 
          mid: '#1e293b' 
        },
        'link-blue': { 
          DEFAULT: '#2383e2', 
          pressed: '#1b6cb5' 
        },
        brand: {
          pink: '#d44079', 'pink-deep': '#b02a5e',
          orange: '#d9730d', 'orange-deep': '#ad5700',
          purple: '#9065b0', 'purple-300': '#ddd6fe', 'purple-800': '#4a2b6a',
          teal: '#129291', green: '#0b6e4f', yellow: '#dfab01',
        },
        tint: {
          peach: '#fff0e5', rose: '#fff0f5', mint: '#f0fff4', lavender: '#f5f3ff',
          sky: '#f0f9ff', yellow: '#fefce8', 'yellow-bold': '#fde047',
          cream: '#fff8ee', gray: '#f9fafb',
        },
        canvas: '#ffffff',
        surface: { DEFAULT: '#f7f7f5', soft: '#f1f1ef' },
        hairline: { DEFAULT: 'rgba(15, 15, 15, 0.1)', soft: 'rgba(15, 15, 15, 0.05)', strong: 'rgba(15, 15, 15, 0.2)' },
        ink: { DEFAULT: '#37352f', deep: '#050505' },
        charcoal: '#403e39',
        slate: '#787774',
        steel: '#9b9a97',
        stone: '#acaba9',
        muted: '#d1d1d1',
        'on-dark': '#ffffff',
        success: '#0b6e4f',
        warning: '#d9730d',
        error: '#d44000',
      },
      borderRadius: {
        md: '8px', lg: '12px', xl: '16px',
      },
      boxShadow: {
        subtle: '0px 1px 2px 0px rgba(15, 15, 15, 0.04)',
        card: '0px 4px 12px 0px rgba(15, 15, 15, 0.08)',
        mockup: '0px 24px 48px -8px rgba(15, 15, 15, 0.20)',
        modal: '0px 16px 48px -8px rgba(15, 15, 15, 0.16)',
      },
    },
  },
  plugins: [],
};
