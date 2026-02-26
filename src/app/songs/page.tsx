'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { api, Song } from '@/lib/api';
import SongCard from '@/components/SongCard';
import MoodMixer from '@/components/MoodMixer';
import DownloadSessionModal from '@/components/DownloadSessionModal';

export default function SongsPage() {
    const { user, isLoading: authLoading, logout } = useAuth();
    const { play } = usePlayer();
    const router = useRouter();

    const [songs, setSongs] = useState<Song[]>([]);
    const [topSongs, setTopSongs] = useState<Song[]>([]);
    const [latestSongs, setLatestSongs] = useState<Song[]>([]);
    const [randomSongs, setRandomSongs] = useState<Song[]>([]);
    const [relaxSongs, setRelaxSongs] = useState<Song[]>([]);
    const [focusSongs, setFocusSongs] = useState<Song[]>([]);
    const [energeticSongs, setEnergeticSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [downloadState, setDownloadState] = useState({
        isOpen: false,
        title: 'Download for Tonight',
        total: 0,
        completed: 0,
        failed: 0,
        storageUsed: null as number | null,
        storageQuota: null as number | null,
        error: null as string | null,
    });

    // Guard: belum login → redirect ke /login
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        // If searching, use debounce
        if (search) {
            const timer = setTimeout(() => {
                fetchSongs(search);
            }, 600); // 600ms debounce
            return () => clearTimeout(timer);
        } else {
            fetchAllSections();
        }
    }, [user, search]);

    async function fetchAllSections() {
        setIsLoading(true);
        try {
            const [top, latest, random, relax, focus, energetic] = await Promise.all([
                api.songs.list({ sort: 'plays', limit: 8 }),
                api.songs.list({ sort: 'latest', limit: 8 }),
                api.songs.list({ sort: 'random', limit: 8 }),
                api.songs.list({ mood: 'Relax', limit: 4 }),
                api.songs.list({ mood: 'Focus', limit: 4 }),
                api.songs.list({ mood: 'Energetic', limit: 4 }),
            ]);
            setTopSongs(top.songs);
            setLatestSongs(latest.songs);
            setRandomSongs(random.songs);
            setRelaxSongs(relax.songs);
            setFocusSongs(focus.songs);
            setEnergeticSongs(energetic.songs);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchSongs(q: string) {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.songs.list({ q, limit: 50 });
            setSongs(data.songs);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (search.trim()) {
            fetchSongs(search);
        } else {
            fetchAllSections();
        }
    }

    async function updateStorageEstimate() {
        if (!('storage' in navigator) || !navigator.storage.estimate) return;
        const { usage, quota } = await navigator.storage.estimate();
        setDownloadState((prev) => ({
            ...prev,
            storageUsed: usage ?? null,
            storageQuota: quota ?? null,
        }));
    }

    async function cacheDownloads(ids: string[], title: string) {
        setDownloadState((prev) => ({
            ...prev,
            isOpen: true,
            title,
            total: 0,
            completed: 0,
            failed: 0,
            error: null,
        }));

        try {
            if (!('caches' in window)) {
                throw new Error('Cache API not supported on this device.');
            }
            if (ids.length === 0) {
                throw new Error('No songs available to download.');
            }

            const { items } = await api.songs.download(ids);
            setDownloadState((prev) => ({ ...prev, total: items.length }));

            const cache = await caches.open('offlineCache');
            let completed = 0;
            let failed = 0;

            for (const item of items) {
                try {
                    await cache.add(item.url);
                    completed += 1;
                } catch (err) {
                    console.error('[Download] Failed to cache', item.url, err);
                    failed += 1;
                }
                setDownloadState((prev) => ({ ...prev, completed, failed }));
                await updateStorageEstimate();
            }
        } catch (err: any) {
            setDownloadState((prev) => ({ ...prev, error: err.message || 'Download failed.' }));
        } finally {
            await updateStorageEstimate();
        }
    }

    async function downloadForTonight() {
        const baseSongs = [
            ...topSongs.slice(0, 4),
            ...relaxSongs.slice(0, 4),
        ];
        const ids = Array.from(new Set(baseSongs.map((s) => s.id)));
        await cacheDownloads(ids, 'Download for Tonight');
    }

    async function downloadSong(song: Song) {
        await cacheDownloads([song.id], `Download: ${song.title}`);
    }

    const moodMixes = [
        {
            mood: 'Relax',
            title: 'Santai Dulu',
            description: 'Jeda sejenak dengan ambient dan chill picks.',
            songs: relaxSongs,
            accent: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
        },
        {
            mood: 'Focus',
            title: 'Teman Fokus',
            description: 'Beat halus buat kerja dan belajar lebih fokus.',
            songs: focusSongs,
            accent: 'bg-gradient-to-br from-emerald-400 via-green-500 to-lime-600',
        },
        {
            mood: 'Energetic',
            title: 'Power Boost',
            description: 'Naikkan energi dengan tempo yang lebih cepat.',
            songs: energeticSongs,
            accent: 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500',
        },
    ].filter((mix) => mix.songs.length > 0);

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="px-6 pb-20 max-w-2xl mx-auto min-h-screen">
            <DownloadSessionModal
                state={downloadState}
                onClose={() => setDownloadState((prev) => ({ ...prev, isOpen: false }))}
            />
            {/* Discover Header - Simple welcome */}
            <header className="py-8">
                <h1 className="font-extrabold text-4xl text-brand-text tracking-tight mb-1">Discover</h1>
                <p className="text-brand-muted text-sm font-medium">Temukan musik favoritmu di sini.</p>
                <div className="mt-4">
                    <button
                        onClick={downloadForTonight}
                        className="text-[11px] font-black uppercase tracking-widest bg-brand-primary text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition"
                    >
                        Download for Tonight
                    </button>
                </div>
            </header>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-10">
                <input
                    type="search"
                    placeholder="Cari lagu atau artis…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white text-brand-text placeholder-brand-muted
                     rounded-2xl px-5 py-4 pr-12 text-sm outline-none shadow-sm
                     focus:ring-2 focus:ring-brand-accent transition border border-gray-100 font-medium"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </form>

            {/* States */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="text-red-400 text-center py-10">{error}</div>
            )}

            {/* Main Content Sections */}
            {!isLoading && !error && (
                <>
                    {search ? (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="font-bold text-xl mb-4 text-brand-text">Hasil untuk "{search}"</h2>
                            {songs.length === 0 ? (
                                <div className="text-brand-muted text-center py-10">Tidak ada lagu ditemukan.</div>
                            ) : (
                                <div className="space-y-1">
                                    {songs.map((song) => (
                                        <SongCard
                                            key={song.id}
                                            song={song}
                                            onPlay={() => play(song, songs)}
                                            onClick={() => router.push(`/songs/${song.id}`)}
                                            onDownload={() => downloadSong(song)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <MoodMixer mixes={moodMixes} onPlayMix={(songs) => play(songs[0], songs)} />

                            {/* Rekomendasi / Terbaru - NOW AT TOP */}
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-black text-3xl text-brand-text tracking-tight">Rekomendasi</h2>
                                    <button
                                        onClick={() => router.push('/songs/list/latest')}
                                        className="text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
                                    >
                                        Lihat Semua
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    {latestSongs.slice(0, 4).map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => play(song, latestSongs)}
                                            className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                                        >
                                            <div className="aspect-square rounded-[1.8rem] overflow-hidden mb-4 relative shadow-inner">
                                                <img
                                                    src={song.coverUrl || 'https://placehold.co/300x300?text=No+Cover'}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    alt={song.title}
                                                />
                                                <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="w-12 h-12 bg-white text-brand-primary rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-1">
                                                <h3 className="font-black text-base text-brand-text truncate leading-tight mb-0.5">{song.title}</h3>
                                                <p className="text-[11px] text-brand-muted font-bold tracking-tight truncate">
                                                    {song.artists.map(a => a.name).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Top Play - NOW BELOW */}
                            <section>
                                <div className="flex items-center justify-between mb-4 mt-4">
                                    <h2 className="font-extrabold text-2xl text-brand-text">Top Play</h2>
                                    <button
                                        onClick={() => router.push('/songs/list/plays')}
                                        className="text-[10px] font-black tracking-widest uppercase text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full hover:bg-brand-primary hover:text-white transition-all"
                                    >
                                        Lihat Semua
                                    </button>
                                </div>
                                <div className="space-y-1 bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100">
                                    {topSongs.map((song) => (
                                        <SongCard
                                            key={song.id}
                                            song={song}
                                            onPlay={() => play(song, topSongs)}
                                            onClick={() => router.push(`/songs/${song.id}`)}
                                            onDownload={() => downloadSong(song)}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Relax Mood */}
                            {relaxSongs.length > 0 && (
                                <section>
                                    <h2 className="font-extrabold text-2xl text-brand-text mb-4">Santai Dulu</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {relaxSongs.map((song) => (
                                            <div key={song.id} onClick={() => play(song, relaxSongs)} className="flex items-center gap-3 bg-blue-50/30 p-3 rounded-2xl cursor-pointer hover:bg-blue-50/50 transition-all hover:shadow-sm">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                                                    <img src={song.coverUrl || ''} className="w-full h-full object-cover" alt={song.title} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-brand-text truncate">{song.title}</p>
                                                    <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest truncate">{song.artists[0]?.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Focus Mood */}
                            {focusSongs.length > 0 && (
                                <section>
                                    <h2 className="font-extrabold text-2xl text-brand-text mb-4">Teman Fokus</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {focusSongs.map((song) => (
                                            <div key={song.id} onClick={() => play(song, focusSongs)} className="flex items-center gap-3 bg-purple-50/30 p-3 rounded-2xl cursor-pointer hover:bg-purple-50/50 transition-all hover:shadow-sm">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                                                    <img src={song.coverUrl || ''} className="w-full h-full object-cover" alt={song.title} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-brand-text truncate">{song.title}</p>
                                                    <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest truncate">{song.artists[0]?.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Random Discovery */}
                            <section className="bg-brand-primary/5 -mx-6 px-6 py-10 rounded-[3.5rem] mt-4 shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-extrabold text-2xl text-brand-text">Surprize Me!</h2>
                                    <svg className="w-6 h-6 text-brand-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    {randomSongs.map((song) => (
                                        <SongCard
                                            key={song.id}
                                            song={song}
                                            onPlay={() => play(song, randomSongs)}
                                            onClick={() => router.push(`/songs/${song.id}`)}
                                            onDownload={() => downloadSong(song)}
                                        />
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
