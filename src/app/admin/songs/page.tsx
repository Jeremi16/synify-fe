'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import EditSongModal from '@/components/admin/EditSongModal';

export default function ManageSongsPage() {
    const [songs, setSongs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingSong, setEditingSong] = useState<any | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSongs();
    }, []);

    async function fetchSongs() {
        setIsLoading(true);
        try {
            const data = await api.songs.list({ q: searchQuery, limit: 100, verifyStorage: true } as any);
            setSongs(data.songs);
        } catch (err: any) {
            setError('Gagal memuat daftar lagu.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSongs();
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Hapus lagu "${title}" secara permanen?`)) return;

        setIsDeleting(id);
        try {
            await api.songs.delete(id);
            setSongs(songs.filter(s => s.id !== id));
        } catch (err: any) {
            alert('Gagal menghapus lagu: ' + err.message);
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="container mx-auto p-6 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 mt-8">
                    <div>
                        <Link href="/admin/upload" className="text-xs font-black text-brand-primary uppercase tracking-widest mb-3 flex items-center gap-2 hover:opacity-70 transition-opacity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                            Kembali ke Upload
                        </Link>
                        <h1 className="text-4xl font-black text-brand-text tracking-tight">Kelola Playlist</h1>
                        <p className="text-brand-muted font-medium mt-1">Edit atau hapus lagu dari database utama</p>
                    </div>

                    <form onSubmit={handleSearch} className="w-full md:w-auto flex gap-3">
                        <div className="relative flex-1 md:w-80">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cari judul atau artis..."
                                className="w-full bg-white border border-gray-200 px-5 py-4 pl-12 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium shadow-sm"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <button type="submit" className="btn-primary px-8 shadow-lg shadow-brand-primary/20">Cari</button>
                    </form>
                </div>

                {/* Song List */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-brand-muted font-bold">Memuat lagu...</p>
                        </div>
                    ) : songs.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="text-5xl mb-6">🏜️</div>
                            <h3 className="text-xl font-black text-brand-text mb-2">Lagu tidak ditemukan</h3>
                            <p className="text-brand-muted">Coba kata kunci pencarian yang berbeda.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] border-b border-gray-100">
                                        <th className="px-8 py-5">Lagu</th>
                                        <th className="px-6 py-5 text-center">Cloud Storage</th>
                                        <th className="px-6 py-5">Genre</th>
                                        <th className="px-6 py-5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {songs.map(song => (
                                        <tr key={song.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 relative rounded-xl overflow-hidden shadow-sm shrink-0 bg-gray-100">
                                                        <Image src={song.coverUrl || '/images/default-album.png'} alt={song.title} fill className="object-cover" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-brand-text truncate">{song.title}</p>
                                                        <p className="text-xs text-brand-muted font-medium truncate">
                                                            {song.artists?.map((a: any) => a.name).join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {song.existsInStorage === true ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase border border-green-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                        File OK
                                                    </span>
                                                ) : song.existsInStorage === false ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase border border-red-100" title="File tidak ditemukan di R2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        File Hilang
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full uppercase">
                                                        ...
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-brand-accent/10 text-brand-accent text-[10px] font-black rounded-full uppercase">
                                                    {song.genre || 'No Genre'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingSong(song)}
                                                        className="p-2.5 bg-brand-primary/5 text-brand-primary rounded-xl hover:bg-brand-primary/10 transition-colors"
                                                        title="Edit Metadata"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(song.id, song.title)}
                                                        disabled={isDeleting === song.id}
                                                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                                                        title="Hapus Lagu"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {editingSong && (
                <EditSongModal
                    song={editingSong}
                    onClose={() => setEditingSong(null)}
                    onSuccess={(updatedSong) => {
                        setSongs(songs.map(s => s.id === updatedSong.id ? updatedSong : s));
                        setEditingSong(null);
                    }}
                />
            )}
        </div>
    );
}
