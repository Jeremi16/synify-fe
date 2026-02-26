'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: object) => void;
                    renderButton: (el: HTMLElement, options: object) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const { loginWithGoogle, user, isLoading } = useAuth();
    const router = useRouter();
    const googleBtnRef = useRef<HTMLDivElement>(null);

    // Sudah login → redirect ke /songs
    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/songs');
        }
    }, [user, isLoading, router]);

    // Load Google Identity Services script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.head.appendChild(script);
        return () => script.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function initGoogle() {
        if (!window.google || !googleBtnRef.current) return;

        window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: async (response: { credential: string }) => {
                try {
                    await loginWithGoogle(response.credential);
                    router.replace('/songs');
                } catch (err) {
                    console.error('Login gagal:', err);
                }
            },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: 280,
            text: 'signin_with',
        });
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-brand-bg">
            {/* Logo */}
            <div className="mb-8">
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-brand-primary fill-current mx-auto" aria-hidden>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <h1 className="text-3xl font-bold mt-4 text-brand-text">Spotify Clone</h1>
                <p className="text-brand-muted mt-2 text-base font-medium">
                    Nikmati jutaan lagu, di mana saja
                </p>
            </div>

            {/* Google Sign-in Button */}
            <div className="flex flex-col items-center gap-4">
                <div ref={googleBtnRef} className="min-h-[44px]" />
                <p className="text-brand-muted text-xs mt-4 max-w-xs font-medium">
                    Dengan masuk, kamu menyetujui Syarat Layanan dan Kebijakan Privasi kami.
                </p>
            </div>
        </div>
    );
}
