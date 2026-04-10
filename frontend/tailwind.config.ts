import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		screens: {
			'xs': '375px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		extend: {
			colors: {
				background: { DEFAULT: '#FAFAF9', subtle: '#F5F5F4' }, // Alabaster/Stone tint
				foreground: '#1C1917', // Stone 900
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: { DEFAULT: '#1A362D', foreground: '#FFFFFF', 50: '#F0F4F2', dark: '#0F1F1A' }, // Midnight Forest
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: { DEFAULT: '#E7E5E4', foreground: '#78716C' }, // Stone 200 / Stone 500
				accent: { DEFAULT: '#B45309', foreground: '#FFFFFF', 50: '#FEF3C7' }, // Deep Terracotta / Amber 700
				destructive: { DEFAULT: '#C0514F', foreground: '#FFFFFF', light: '#F9ECEC', border: '#DFA3A3' },
				border: { DEFAULT: '#D6D3D0', strong: '#A8A29E' }, // Stone 300 / Stone 400
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				text: { primary: '#1C1917', secondary: '#44403C', muted: '#78716C', disabled: '#A8A29E', inverse: '#FFFFFF' },
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			fontSize: {
				xs:   ['0.75rem',  { lineHeight: '1rem'     }],
				sm:   ['0.875rem', { lineHeight: '1.25rem'  }],
				base: ['1rem',     { lineHeight: '1.5rem'   }],
				md:   ['1.125rem', { lineHeight: '1.75rem'  }],
				lg:   ['1.25rem',  { lineHeight: '1.875rem' }],
				xl:   ['1.5rem',   { lineHeight: '2rem'     }],
				'2xl':  ['2rem',     { lineHeight: '2.5rem'   }]
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				display: ['var(--font-display)', 'Georgia', 'serif'],
				sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
			},
			boxShadow: {
				'card': '0 4px 20px rgba(26, 54, 45, 0.08)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;
