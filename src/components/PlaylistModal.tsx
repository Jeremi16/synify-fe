'use client';

import { useState, useEffect } from 'react';
import { api, Playlist } from '@/lib/api';

interface PlaylistModalProps {
    songId: string;
    onClose: () => void;
}

export default function PlaylistModal({ songId, onClose }: PlaylistModalProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    useEffect(() => {
        api.playlists.my(songId)
            .then(data => setPlaylists(data.playlists))
            .catch(err => setError(err.message))
            .finally(() => setIsLoading(false));
    }, [songId]);

    const addToPlaylist = async (playlistId: string, hasSong?: boolean) => {
        if (hasSong) return;
        try {
            await api.playlists.addSong(playlistId, songId);
            setSuccessMsg('Berhasil ditambahkan ke playlist!');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Gagal menambahkan ke playlist.');
        }
    };

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        setIsLoading(true);
        try {
            const res = await api.playlists.create({ name: newPlaylistName });
            // Add song to newly created playlist immediately
            await api.playlists.addSong(res.playlist.id, songId);
            setSuccessMsg('Playlist dibuat & lagu ditambahkan!');
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Gagal membuat playlist.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-text">Tambah ke Playlist</h2>
                    <button onClick={onClose} className="text-brand-muted hover:text-brand-text">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <p className="text-red-500 text-center py-4">{error}</p>
                ) : successMsg ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-xl font-black text-brand-text leading-tight px-4">{successMsg}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* List Playlists */}
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {playlists.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-sm text-brand-muted font-medium mb-1">Belum ada playlist</p>
                                    <p className="text-[10px] text-brand-muted/60 uppercase font-bold">Klik tombol di bawah untuk membuat</p>
                                </div>
                            ) : (
                                playlists.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToPlaylist(p.id, p.hasSong)}
                                        disabled={p.hasSong}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group ${p.hasSong ? 'opacity-40 cursor-default' : 'hover:bg-gray-50 cursor-pointer active:scale-[0.98]'}`}
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-white transition-colors overflow-hidden">
                                            {p.coverUrl ? (
                                                <img src={p.coverUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-6 h-6 text-brand-muted/40" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-extrabold text-brand-text truncate text-sm">{p.name}</p>
                                                {p.hasSong && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-muted bg-gray-100 px-2 py-0.5 rounded-full">Dah Ada</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{p.totalSongs} lagu</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Create Inline */}
                        <div className="pt-2 border-t border-gray-50">
                            {isCreating ? (
                                <form onSubmit={handleCreatePlaylist} className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="Nama playlist baru..."
                                        value={newPlaylistName}
                                        onChange={(e) => setNewPlaylistName(e.target.value)}
                                        className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/10 border border-gray-100"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-brand-text text-white px-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
                                    >
                                        Buat
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="p-3 bg-gray-50 text-brand-muted rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-brand-text font-black text-xs uppercase tracking-[0.15em] rounded-2xl hover:bg-gray-100 transition-all active:scale-[0.98]"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Playlist Baru
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
