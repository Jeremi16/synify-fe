/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    bg: '#F4F6F9',     // 60% Background
                    surface: '#FFFFFF', // 30% Surface (Cards)
                    text: '#111827',    // Base Text
                    muted: '#9CA3AF',   // Secondary Text / Icons
                    primary: '#1A1D29', // 10% Primary Button (Navy)
                    accent: '#FACC15',  // 10% Accent (Yellow for Active states)
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
