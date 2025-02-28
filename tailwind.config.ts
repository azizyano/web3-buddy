import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: '#6d28d9',
          light: '#8b5cf6',
        },
        secondary: {
          DEFAULT: '#059669',
          dark: '#065f46',
        },
        accent: '#22d3ee',
        neural: {
          DEFAULT: '#4f46e5',
          glow: '#818cf8',
        }
      },
      gradientColorStops: {
        'ai-gradient': 'linear-gradient(135deg, #6d28d9 0%, #059669 50%, #22d3ee 100%)',
      },
      boxShadow: {
        'ai': '0 0 20px rgba(109, 40, 217, 0.3)',
      }
    },
  },
  plugins: [],
} satisfies Config;
