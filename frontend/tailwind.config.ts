import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                orange: {
                    50: '#fff5eb',
                    100: '#ffe4cc',
                    200: '#ffc999',
                    300: '#ffad66',
                    400: '#ff9a56',
                    500: '#ff6b35',
                    600: '#e65a2b',
                    700: '#cc4921',
                    800: '#b33817',
                    900: '#99270d',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in',
                'slide-up': 'slideUp 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
        },
    },
    plugins: [],
} satisfies Config;
