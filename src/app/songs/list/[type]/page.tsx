'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { api, Song } from '@/lib/api';
import SongCard from '@/components/SongCard';

export default function SongListPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { play } = usePlayer();
    const router = useRouter();
    const params = useParams();
    const type = params?.type as string; // 'latest' or 'plays'

    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const title = type === 'plays' ? 'Top Play' : 'Rekomendasi';
    const description = type === 'plays'
        ? 'Lagu-lagu yang paling sering diputar minggu ini.'
        : 'Lagu-lagu terbaru yang mungkin kamu suka.';

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !type) return;

        async function fetchSongs() {
            setIsLoading(true);
            try {
                // Fetch with a larger limit for the "See All" page
                const data = await api.songs.list({ sort: type as any, limit: 100 });
                setSongs(data.songs);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSongs();
    }, [user, type]);

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="px-6 pb-32 max-w-2xl mx-auto min-h-screen">
            {/* Header */}
            <header className="py-12 border-b border-gray-100 mb-8">
                <button
                    onClick={() => router.back()}
                    className="text-brand-muted hover:text-brand-primary flex items-center gap-2 mb-6 group transition-colors"
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-bold text-sm">Kembali</span>
                </button>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="font-black text-4xl text-brand-text tracking-tight mb-2">{title}</h1>
                        <p className="text-brand-muted text-sm font-medium">{description}</p>
                    </div>
                </div>
            </header>

            {/* States */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-brand-muted animate-pulse">Memuat lagu...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-500 p-6 rounded-3xl text-center font-bold border border-red-100 italic">
                    {error}
                </div>
            ) : songs.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                    <p className="text-brand-muted font-bold italic">Belum ada lagu untuk ditampilkan.</p>
                </div>
            ) : (
                <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {songs.map((song) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            onPlay={() => play(song, songs)}
                            onClick={() => router.push(`/songs/${song.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
