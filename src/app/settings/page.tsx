'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_KEYS = {
    autoPlay: 'synify.settings.autoplay',
    wifiOnly: 'synify.settings.wifi_only_download',
};

export default function SettingsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [autoPlay, setAutoPlay] = useState(true);
    const [wifiOnly, setWifiOnly] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedAutoplay = localStorage.getItem(SETTINGS_KEYS.autoPlay);
        const storedWifi = localStorage.getItem(SETTINGS_KEYS.wifiOnly);
        if (storedAutoplay !== null) setAutoPlay(storedAutoplay === 'true');
        if (storedWifi !== null) setWifiOnly(storedWifi === 'true');
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(SETTINGS_KEYS.autoPlay, String(autoPlay));
    }, [autoPlay]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(SETTINGS_KEYS.wifiOnly, String(wifiOnly));
    }, [wifiOnly]);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="px-6 pt-12 pb-32 max-w-2xl mx-auto">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-black text-brand-text tracking-tighter mb-2">Pengaturan</h1>
                <p className="text-brand-muted font-medium">Atur preferensi aplikasi dan akun</p>
            </header>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 space-y-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-brand-muted/60 mb-3">Akun</p>
                        <div className="flex items-center justify-between p-4 bg-gray-50/60 border border-gray-100 rounded-2xl">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-brand-text truncate">{user.name}</p>
                                <p className="text-xs text-brand-muted truncate">{user.email}</p>
                            </div>
                            <Link
                                href="/profile"
                                className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full hover:bg-brand-primary hover:text-white transition-all"
                            >
                                Lihat Profil
                            </Link>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-brand-muted/60 mb-3">Pemutar</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-brand-text">Auto Play</p>
                                    <p className="text-xs text-brand-muted">Lanjutkan lagu berikutnya otomatis</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAutoPlay((prev) => !prev)}
                                    className={`w-12 h-7 rounded-full relative transition-colors ${autoPlay ? 'bg-brand-primary' : 'bg-gray-200'}`}
                                    aria-pressed={autoPlay}
                                    aria-label="Toggle Auto Play"
                                >
                                    <span
                                        className={`w-6 h-6 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${autoPlay ? 'left-[26px]' : 'left-0.5'}`}
                                    />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-brand-text">Unduh via Wi‑Fi</p>
                                    <p className="text-xs text-brand-muted">Hemat kuota saat download</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setWifiOnly((prev) => !prev)}
                                    className={`w-12 h-7 rounded-full relative transition-colors ${wifiOnly ? 'bg-brand-primary' : 'bg-gray-200'}`}
                                    aria-pressed={wifiOnly}
                                    aria-label="Toggle Unduh via Wi-Fi"
                                >
                                    <span
                                        className={`w-6 h-6 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${wifiOnly ? 'left-[26px]' : 'left-0.5'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-brand-muted/60 mb-3">Aplikasi</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-brand-text">Bahasa</p>
                                    <p className="text-xs text-brand-muted">Indonesia</p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted bg-gray-100 px-3 py-1.5 rounded-full">
                                    Default
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-brand-text">Versi Aplikasi</p>
                                    <p className="text-xs text-brand-muted">v1.0.0</p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted bg-gray-100 px-3 py-1.5 rounded-full">
                                    Stable
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <Link href="/songs" className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-primary font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
