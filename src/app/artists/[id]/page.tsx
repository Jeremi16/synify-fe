'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Song } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import SongCard from '@/components/SongCard';

export default function ArtistPage() {
    const params = useParams<{ id: string }>();
    const artistId = params?.id;
    const router = useRouter();
    const { play } = usePlayer();

    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!artistId) return;
        let isMounted = true;
        setIsLoading(true);
        api.songs.list({ artist: artistId, sort: 'latest', limit: 50 })
            .then((data) => {
                if (!isMounted) return;
                setSongs(data.songs);
                setError(null);
            })
            .catch((err: any) => {
                if (!isMounted) return;
                setError(err.message || 'Gagal mengambil lagu artis.');
            })
            .finally(() => {
                if (!isMounted) return;
                setIsLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [artistId]);

    const artist = useMemo(() => songs[0]?.artists?.find((a) => a.id === artistId) || songs[0]?.artists?.[0], [songs, artistId]);

    return (
        <div className="px-4 sm:px-6 pb-28 sm:pb-24 max-w-2xl mx-auto min-h-screen">
            <header className="pt-6 sm:pt-10 pb-6 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                    {artist?.avatarUrl ? (
                        <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-muted font-black text-2xl">
                            {artist?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-muted">Artist</p>
                    <h1 className="text-3xl sm:text-4xl font-black text-brand-text truncate">{artist?.name || 'Artist'}</h1>
                    <p className="text-sm text-brand-muted font-medium">{songs.length} lagu</p>
                </div>
            </header>

            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="text-red-400 text-center py-10">{error}</div>
            )}

            {!isLoading && !error && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-brand-text">Lagu</h2>
                        <button
                            onClick={() => router.back()}
                            className="text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
                        >
                            Kembali
                        </button>
                    </div>
                    {songs.length === 0 ? (
                        <div className="text-brand-muted text-center py-10">Belum ada lagu untuk artis ini.</div>
                    ) : (
                        <div className="space-y-1">
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
                </section>
            )}
        </div>
    );
}
