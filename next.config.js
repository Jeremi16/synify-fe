/** @type {import('next').NextConfig} */
const pwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA !== 'false';
const isDev = process.env.NODE_ENV === 'development';

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    // Enable in production by default; keep dev disabled unless explicitly turned on
    disable: !pwaEnabled || isDev,
    // Precache these routes/assets
    runtimeCaching: [
        {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'offlineCache',
                expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
            },
        },
    ],
});

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.r2.cloudflarestorage.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Google profile pictures
            },
            {
                protocol: 'https',
                hostname: 'i.ytimg.com', // YouTube thumbnails
            },
            {
                protocol: 'https',
                hostname: 'placehold.co', // Fallback for Spotify search items without images
            },
            {
                protocol: 'https',
                hostname: 'i.scdn.co', // Spotify cover images
            },
        ],
    },
};

module.exports = withPWA(nextConfig);
