/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Pure black theme for OLED
                black: {
                    DEFAULT: '#000000',
                    soft: '#0A0A0A',
                },
                // Elevated surfaces
                surface: {
                    DEFAULT: '#1C1C1E',
                    elevated: '#2C2C2E',
                    overlay: '#3A3A3C',
                },
                // Brand colors
                brand: {
                    DEFAULT: '#FF3B30',
                    hover: '#FF6259',
                    pressed: '#E6352A',
                    light: '#FF9F9A',
                    dark: '#CC2E24',
                },
                // Status colors
                success: {
                    DEFAULT: '#30D158',
                    light: '#66E085',
                    dark: '#26A746',
                },
                warning: {
                    DEFAULT: '#FFD60A',
                    light: '#FFE34D',
                    dark: '#CCA808',
                },
                error: {
                    DEFAULT: '#FF453A',
                    light: '#FF7A71',
                    dark: '#CC372E',
                },
                // Text colors with opacity
                text: {
                    primary: '#FFFFFF',
                    secondary: '#EBEBF5',
                    tertiary: '#EBEBF599', // 60% opacity
                    quaternary: '#EBEBF54D', // 30% opacity
                    disabled: '#3A3A3C',
                },
                // Border colors
                border: {
                    DEFAULT: '#38383A',
                    light: '#48484A',
                    dark: '#2C2C2E',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // Display sizes
                'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.5px', fontWeight: '800' }],
                'display-md': ['36px', { lineHeight: '44px', letterSpacing: '-0.3px', fontWeight: '800' }],
                'display-sm': ['28px', { lineHeight: '36px', letterSpacing: '0px', fontWeight: '800' }],
                // Heading sizes
                'h1': ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '700' }],
                'h2': ['20px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '700' }],
                'h3': ['18px', { lineHeight: '24px', letterSpacing: '0px', fontWeight: '600' }],
                // Body sizes
                'body-lg': ['17px', { lineHeight: '24px', letterSpacing: '0px', fontWeight: '400' }],
                'body': ['15px', { lineHeight: '22px', letterSpacing: '0px', fontWeight: '400' }],
                'body-sm': ['13px', { lineHeight: '18px', letterSpacing: '0px', fontWeight: '400' }],
                // Label sizes
                'label-lg': ['17px', { lineHeight: '24px', letterSpacing: '0px', fontWeight: '600' }],
                'label': ['15px', { lineHeight: '22px', letterSpacing: '0px', fontWeight: '600' }],
                'label-sm': ['13px', { lineHeight: '18px', letterSpacing: '0px', fontWeight: '600' }],
            },
            spacing: {
                '18': '72px',
                '22': '88px',
                '26': '104px',
                '30': '120px',
            },
            borderRadius: {
                'xl': '20px',
                '2xl': '24px',
                '3xl': '32px',
            },
            boxShadow: {
                'brand': '0 4px 12px rgba(255, 59, 48, 0.3)',
                'brand-lg': '0 8px 24px rgba(255, 59, 48, 0.4)',
                'success': '0 4px 12px rgba(48, 209, 88, 0.3)',
                'card': '0 4px 8px rgba(0, 0, 0, 0.15)',
                'elevated': '0 8px 16px rgba(0, 0, 0, 0.2)',
            },
        },
    },
    plugins: [],
};