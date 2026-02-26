'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, isLoading, logout, refetchUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const joinedDate = user.createdAt
        ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(user.createdAt))
        : '...';

    return (
        <div className="px-6 pt-12 pb-32 max-w-2xl mx-auto">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-black text-brand-text tracking-tighter mb-2">Profil Kamu</h1>
                <p className="text-brand-muted font-medium">Informasi akun dan statistik musikmu</p>
            </header>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Upper Section — Banner-like */}
                <div className="bg-brand-primary/5 p-8 flex flex-col items-center border-b border-gray-50">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-500">
                        <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-100 flex items-center justify-center">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-16 h-16 text-brand-muted/30" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-brand-text leading-tight mb-1">{user.name}</h2>
                    <p className="text-brand-muted font-bold opacity-80">{user.email}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 p-8 gap-4 border-b border-gray-50">
                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center">
                        <span className="text-3xl font-black text-brand-primary mb-1">{user._count?.playlists ?? 0}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">Playlist</span>
                    </div>
                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center">
                        <span className="text-3xl font-black text-brand-text mb-1">{user._count?.playHistory ?? 0}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">Lagu Diputar</span>
                    </div>
                </div>

                {/* Account Details */}
                <div className="p-8 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-brand-muted/60 px-2 mb-4">Informasi Detail</h3>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-4.514A11.042 11.042 0 0010 11.21V10m0 0V4a1 1 0 00-1-1H5a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <span className="text-sm font-bold text-brand-text">Akses/Role</span>
                        </div>
                        <span className="px-4 py-1.5 bg-brand-text text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-black/10">
                            {user.role}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-sm font-bold text-brand-text">Member Sejak</span>
                        </div>
                        <span className="text-sm font-black text-brand-muted">{joinedDate}</span>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => {
                                logout();
                                router.push('/login');
                            }}
                            className="w-full py-5 bg-red-50 text-red-600 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-red-100 transition-all hover:scale-[0.98] active:scale-95"
                        >
                            Keluar Akun
                        </button>
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
