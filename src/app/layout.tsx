import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerProvider } from '@/context/PlayerContext';
import MiniPlayer from '@/components/MiniPlayer';
import TopNav from '@/components/TopNav';

export const metadata: Metadata = {
    title: 'Synify',
    description: 'Pemutar musik berbasis web — Progressive Web App',
    manifest: '/manifest.json',
    icons: {
        icon: '/icons/icon-512.png',
        apple: '/icons/icon-192.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Synify',
    },
};

export const viewport: Viewport = {
    themeColor: '#FFFFFF',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="bg-brand-bg text-brand-text min-h-screen">
                <AuthProvider>
                    <PlayerProvider>
                        {/* Main content — add padding-bottom to avoid overlap with MiniPlayer */}
                        <TopNav />
                        <main className="pb-24">{children}</main>
                        {/* Fixed mini player at bottom */}
                        <MiniPlayer />
                    </PlayerProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
