'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


export default function TopNav() {
    const { user, isLoading, logout } = useAuth();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading || !user || pathname === '/login') return null;

    return (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-3 px-4 sm:py-3.5 sm:px-6 flex items-center justify-between shadow-sm">
            {/* Left: Navigation Links */}
            <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                <Link href="/songs" className="flex items-center gap-2 shrink-0">
                    <img src="/icons/Synify.png" alt="Synify" className="w-8 h-8 rounded-lg object-contain" />
                    <span className="font-black text-sm tracking-tight text-brand-text hidden sm:inline">Synify</span>
                </Link>
                <Link
                    href="/songs"
                    className={`text-xs sm:text-sm font-bold transition-all relative ${pathname === '/songs' ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
                >
                    Discover
                    {pathname === '/songs' && <span className="absolute -bottom-4 sm:-bottom-5 left-0 w-full h-0.5 bg-brand-primary rounded-full"></span>}
                </Link>
                <Link
                    href="/playlists"
                    className={`text-xs sm:text-sm font-bold transition-all relative ${pathname === '/playlists' ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}
                >
                    Playlists
                    {pathname === '/playlists' && <span className="absolute -bottom-4 sm:-bottom-5 left-0 w-full h-0.5 bg-brand-primary rounded-full"></span>}
                </Link>
            </div>

            {/* Right: Profile Dropdown */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-2 sm:p-1.5 sm:pr-2.5 rounded-full transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-gray-200 shrink-0 shadow-inner group-hover:border-brand-primary/30 transition-colors">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-xs">
                                {user.name[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <svg
                        className={`w-4 h-4 text-brand-muted transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                            <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">Account</p>
                            <p className="text-sm font-bold text-brand-text truncate">{user.name}</p>
                        </div>

                        <Link
                            href="/profile"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-text hover:bg-brand-primary/5 transition-colors"
                        >
                            <svg className="w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profil Saya
                        </Link>
                        {user.role === 'ADMIN' && (
                            <Link
                                href="/admin"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-text hover:bg-brand-primary/5 transition-colors"
                            >
                                <svg className="w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Admin Panel
                            </Link>
                        )}
                        <Link
                            href="/settings"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-text hover:bg-brand-primary/5 transition-colors"
                        >
                            <svg className="w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Pengaturan
                        </Link>

                        <div className="h-px bg-gray-50 my-1 mx-2" />

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Keluar
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
