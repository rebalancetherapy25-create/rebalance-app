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
				background: {
					DEFAULT: 'hsl(var(--background))',
					subtle: 'hsl(var(--muted))',
				},
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					50: 'hsl(334 42% 96%)',
					dark: 'hsl(334 42% 20%)',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					50: 'hsl(341 48% 96%)',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					light: 'hsl(0 84% 96%)',
					border: 'hsl(0 84% 82%)',
				},
				border: {
					DEFAULT: 'hsl(var(--border))',
					strong: 'hsl(330 25% 75%)',
				},
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				text: {
					primary: 'hsl(var(--foreground))',
					secondary: 'hsl(332 22% 30%)',
					muted: 'hsl(var(--muted-foreground))',
					disabled: 'hsl(339 11% 70%)',
					inverse: '#FFFFFF',
				},
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
				'card': '0 4px 20px rgba(107, 41, 72, 0.08)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;
