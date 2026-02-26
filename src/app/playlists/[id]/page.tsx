'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { api, PlaylistDetail, Song, Playlist } from '@/lib/api';
import EditPlaylistModal from '@/components/EditPlaylistModal';

export default function PlaylistPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { play } = usePlayer();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk Add States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
    const [isAddingBulk, setIsAddingBulk] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !id) return;
        api.playlists
            .get(id)
            .then(setPlaylist)
            .catch((e) => setError(e.message))
            .finally(() => setIsLoading(false));
    }, [user, id]);

    function playAll(startIndex: number = 0, isShuffle: boolean = false) {
        if (!playlist) return;
        const songs: Song[] = playlist.songs.map((item) => item.song);

        let startIdx = startIndex;
        if (isShuffle && startIndex === 0 && songs.length > 0) {
            startIdx = Math.floor(Math.random() * songs.length);
        }

        play(songs[startIdx], songs, { shuffle: isShuffle });
    }

    async function handleDelete() {
        if (!playlist) return;
        if (!confirm('Hapus playlist ini secara permanen?')) return;

        setIsDeleting(true);
        try {
            await api.playlists.delete(playlist.id);
            router.push('/playlists');
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus playlist');
            setIsDeleting(false);
        }
    }

    const isOwner = user?.id === playlist?.owner.id;

    async function handleSearch(q: string) {
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const data = await api.songs.list({ q });
            // Filter out songs already in playlist
            const currentIds = new Set(playlist?.songs.map(s => s.song.id) || []);
            setSearchResults(data.songs.filter(s => !currentIds.has(s.id)));
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    }

    const toggleSelection = (id: string) => {
        const next = new Set(selectedSongIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedSongIds(next);
    };

    async function handleAddBulk() {
        if (selectedSongIds.size === 0 || !playlist) return;

        setIsAddingBulk(true);
        const idsToAdd = Array.from(selectedSongIds);

        try {
            // Add songs sequentially or in parallel? Parallel is faster but might hit limits.
            // Let's go with Promise.all for now.
            await Promise.all(idsToAdd.map(sid => api.playlists.addSong(playlist.id, sid)));

            // Refresh playlist
            const updated = await api.playlists.get(playlist.id);
            setPlaylist(updated);

            // Clear selections
            setSelectedSongIds(new Set());
            setSearchResults([]);
            setSearchQuery('');
        } catch (err: any) {
            alert(err.message || 'Gagal menambahkan lagu');
        } finally {
            setIsAddingBulk(false);
        }
    }

    if (isLoading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-400">{error || 'Playlist tidak ditemukan.'}</p>
                <button onClick={() => router.back()} className="text-brand-green hover:underline">
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="text-brand-muted hover:text-white flex items-center gap-2 mb-6"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
            </button>

            {/* Playlist header */}
            <div className="flex gap-4 mb-6 items-end">
                <div className="w-48 h-48 bg-brand-elevated rounded-3xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xl border-4 border-white rotate-1">
                    {playlist.coverUrl ? (
                        <Image src={playlist.coverUrl} alt={playlist.name} width={192} height={192} className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 flex items-center justify-center">
                            <svg className="w-20 h-20 text-brand-primary/40" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                            </svg>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                    <p className="text-[10px] text-brand-muted uppercase tracking-[0.3em] font-black mb-1">Playlist</p>
                    <div className="flex items-center gap-4 flex-wrap">
                        <h1 className="text-4xl sm:text-5xl font-black text-brand-text tracking-tight leading-none">{playlist.name}</h1>
                        {isOwner && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="p-2.5 bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md rounded-2xl transition-all text-brand-muted hover:text-brand-primary"
                                title="Edit Playlist"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {playlist.description && (
                        <p className="text-brand-muted text-base mt-3 font-medium line-clamp-2 max-w-md">{playlist.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-black text-brand-primary">{playlist.owner.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <p className="text-brand-muted text-[11px] font-bold tracking-tight">
                            <span className="text-brand-text font-black">{playlist.owner.name}</span>
                            <span className="mx-2 opacity-30">•</span>
                            <span>{playlist.totalSongs} lagu</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Play controls */}
            {playlist.songs.length > 0 ? (
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => playAll(0, false)}
                        className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/30 hover:scale-105 active:scale-95 transition-transform"
                    >
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h3 className="font-black text-lg text-brand-text tracking-tight leading-none mb-1">Putar Berurut</h3>
                        <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest">Dengarkan koleksimu</p>
                    </div>
                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all disabled:opacity-50 text-brand-muted"
                            title="Hapus Playlist"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            ) : (
                isOwner && (
                    <div className="mb-10">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Hapus Playlist Kosong
                        </button>
                    </div>
                )
            )}

            {/* Track list */}
            <div className="mb-8">
                <h2 className="text-xl font-black text-brand-text mb-4">Lagu di Playlist</h2>
                {playlist.songs.length === 0 ? (
                    <p className="text-brand-muted text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">Playlist masih kosong.</p>
                ) : (
                    <div className="space-y-1">
                        {playlist.songs.map((item, idx) => (
                            <button
                                key={item.song.id}
                                onClick={() => playAll(idx, false)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                             hover:bg-brand-elevated transition-colors text-left group"
                            >
                                <span className="text-brand-muted text-xs w-6 text-right shrink-0 font-bold opacity-30 group-hover:opacity-100 transition-opacity">
                                    {idx + 1}
                                </span>
                                <div className="w-10 h-10 bg-brand-elevated rounded shrink-0 overflow-hidden flex items-center justify-center">
                                    {item.song.coverUrl ? (
                                        <Image src={item.song.coverUrl} alt="" width={40} height={40} className="object-cover w-full h-full" />
                                    ) : (
                                        <svg className="w-5 h-5 text-brand-muted" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate group-hover:text-brand-primary transition-colors">{item.song.title}</p>
                                    <p className="text-brand-muted text-[10px] font-black uppercase tracking-widest truncate">
                                        {item.song.artists?.map(map_artist => map_artist.name).join(', ') || 'Unknown Artist'}
                                    </p>
                                </div>
                                <span className="text-brand-muted text-sm shrink-0 font-medium">{item.song.duration}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bulk Add Section */}
            {isOwner && (
                <div className="mt-12 pt-12 border-t border-gray-100 pb-32">
                    <h2 className="text-xl font-black text-brand-text mb-2">Cari & Tambah Lagu</h2>
                    <p className="text-sm text-brand-muted mb-6 font-medium">Temukan lagu favoritmu dan tambahkan langsung ke playlist ini.</p>

                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Cari lagu (judul atau artis)..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-gray-50 px-5 py-4 pl-12 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 border border-transparent focus:border-brand-primary/20 transition-all font-bold shadow-sm"
                        />
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {isSearching ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="space-y-4">
                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                {searchResults.map(song => (
                                    <div
                                        key={song.id}
                                        className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <div className="relative group cursor-pointer" onClick={() => toggleSelection(song.id)}>
                                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedSongIds.has(song.id) ? 'bg-brand-primary border-brand-primary' : 'bg-white border-gray-300'}`}>
                                                {selectedSongIds.has(song.id) && (
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                            {song.coverUrl && <Image src={song.coverUrl} alt="" width={40} height={40} className="object-cover w-full h-full" />}
                                        </div>

                                        <div className="flex-1 min-w-0 pointer-events-none">
                                            <p className="font-bold text-sm truncate">{song.title}</p>
                                            <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest truncate">
                                                {song.artists.map(a => a.name).join(', ')}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => toggleSelection(song.id)}
                                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${selectedSongIds.has(song.id) ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-primary bg-gray-100'}`}
                                        >
                                            {selectedSongIds.has(song.id) ? 'Terpilih' : 'Pilih'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                                <button
                                    onClick={handleAddBulk}
                                    disabled={selectedSongIds.size === 0 || isAddingBulk}
                                    className={`w-full py-4 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3
                                        ${selectedSongIds.size > 0
                                            ? 'bg-brand-text text-white hover:scale-[1.02] active:scale-[0.98]'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-0 translate-y-10'}`}
                                    style={{
                                        opacity: selectedSongIds.size > 0 ? 1 : 0,
                                        transform: selectedSongIds.size > 0 ? 'translateY(0)' : 'translateY(40px)'
                                    }}
                                >
                                    {isAddingBulk ? (
                                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-[10px]">
                                                {selectedSongIds.size}
                                            </span>
                                            Tambah ke Playlist
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : searchQuery.length >= 2 ? (
                        <p className="text-center py-10 text-brand-muted font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            Tidak ditemukan lagu untuk "{searchQuery}"
                        </p>
                    ) : null}
                </div>
            )}

            {/* Modals */}
            {showEditModal && (
                <EditPlaylistModal
                    playlist={playlist}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={(updated) => {
                        setPlaylist({ ...playlist, ...updated });
                        setShowEditModal(false);
                    }}
                />
            )}
        </div>
    );
}
