'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { api, Song } from '@/lib/api';

export default function SongDetailPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { play, currentSong, isPlaying, pause, resume } = usePlayer();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [song, setSong] = useState<Song | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !id) return;
        api.songs.get(id).then(setSong).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
    }, [user, id]);

    const isCurrentSong = currentSong?.id === song?.id;

    function handleToggle() {
        if (!song) return;
        if (isCurrentSong) {
            isPlaying ? pause() : resume();
        } else {
            play(song);
        }
    }

    if (isLoading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !song) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-400">{error || 'Lagu tidak ditemukan.'}</p>
                <button onClick={() => router.back()} className="text-brand-green hover:underline">
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-sm mx-auto px-4 pt-10 pb-8 flex flex-col items-center text-center">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="self-start mb-6 text-brand-muted hover:text-white transition-colors flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
            </button>

            {/* Cover art */}
            <div className="w-64 h-64 bg-brand-elevated rounded-2xl overflow-hidden shadow-2xl mb-8 flex items-center justify-center">
                {song.coverUrl ? (
                    <Image src={song.coverUrl} alt={song.title} width={256} height={256} className="object-cover w-full h-full" />
                ) : (
                    <svg className="w-24 h-24 text-brand-muted" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                )}
            </div>

            {/* Song info */}
            <h1 className="text-2xl font-bold mb-1">{song.title}</h1>
            <p className="text-brand-muted mb-1">
                {song.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
            </p>
            {song.album && <p className="text-brand-muted text-sm mb-6">{song.album.title}</p>}

            {/* Metadata pills */}
            <div className="flex gap-2 mb-8 flex-wrap justify-center">
                {song.genre && (
                    <span className="text-xs bg-brand-elevated px-3 py-1 rounded-full text-brand-muted">
                        {song.genre}
                    </span>
                )}
                <span className="text-xs bg-brand-elevated px-3 py-1 rounded-full text-brand-muted">
                    {song.duration}
                </span>
                {song.trackNumber && (
                    <span className="text-xs bg-brand-elevated px-3 py-1 rounded-full text-brand-muted">
                        Track #{song.trackNumber}
                    </span>
                )}
            </div>

            {/* Play button */}
            <button
                onClick={handleToggle}
                className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center
                   shadow-lg hover:scale-105 active:scale-95 transition-transform"
                aria-label={isCurrentSong && isPlaying ? 'Pause' : 'Play'}
            >
                {isCurrentSong && isPlaying ? (
                    <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8 text-black ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
