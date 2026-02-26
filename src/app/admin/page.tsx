'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user?.role !== 'ADMIN') {
            router.push('/songs');
        }
    }, [user, isLoading, router]);

    if (isLoading || user?.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const cards = [
        {
            title: 'Manage Music',
            desc: 'Edit metadata, lyrics, and mood tags for songs.',
            icon: '🎵',
            href: '/admin/songs',
            count: 'Database Utama',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Upload Content',
            desc: 'Add new tracks and sync with R2 storage.',
            icon: '📤',
            href: '/admin/upload',
            count: 'R2 Storage',
            color: 'bg-green-50 text-green-600'
        },
        {
            title: 'Analytics',
            desc: 'View play counts and user engagement.',
            icon: '📈',
            href: '/admin/analytics',
            count: 'Coming Soon',
            color: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'User Management',
            desc: 'Control user permissions and roles.',
            icon: '👥',
            href: '/admin/users',
            count: 'Coming Soon',
            color: 'bg-orange-50 text-orange-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-brand-text tracking-tight mb-2">Admin Control</h1>
                    <p className="text-brand-muted font-medium">Selamat datang, {user.name}. Apa yang ingin Anda kelola hari ini?</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card) => (
                        <Link
                            key={card.title}
                            href={card.href}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                        >
                            <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm`}>
                                {card.icon}
                            </div>
                            <h3 className="text-xl font-black text-brand-text mb-2 tracking-tight">{card.title}</h3>
                            <p className="text-sm text-brand-muted font-medium mb-6 leading-relaxed">
                                {card.desc}
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted/60">{card.count}</span>
                                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-brand-muted group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* System Status Section */}
                <section className="mt-12 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
                    <h2 className="text-2xl font-black text-brand-text mb-6 tracking-tight">System Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <p className="text-xs font-black text-brand-muted uppercase tracking-widest">API Status</p>
                            <p className="flex items-center gap-2 text-green-600 font-bold">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Operational
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-brand-muted uppercase tracking-widest">Storage (Cloudflare R2)</p>
                            <p className="text-brand-text font-bold">Connected</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-brand-muted uppercase tracking-widest">AI Engine</p>
                            <p className="text-brand-primary font-bold">Ready</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
