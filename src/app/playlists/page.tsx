'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, Playlist } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

export default function MyPlaylistsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create playlist state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        fetchPlaylists();
    }, [user]);

    async function fetchPlaylists() {
        setIsLoading(true);
        try {
            const data = await api.playlists.my();
            setPlaylists(data.playlists);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            const res = await api.playlists.create({ name: newName, description: newDesc });
            setPlaylists([res.playlist, ...playlists]);
            setNewName('');
            setNewDesc('');
            setIsCreating(false);
        } catch (err: any) {
            alert(err.message || 'Gagal membuat playlist');
        }
    }

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="px-6 pt-8 pb-24 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-extrabold text-brand-text">Playlist Kamu</h1>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-brand-primary text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                    {isCreating ? 'Batal' : '+ Playlist Baru'}
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl mb-8 border border-gray-100 flex flex-col gap-4 shadow-sm">
                    <input
                        type="text"
                        placeholder="Nama playlist"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-gray-50 px-4 py-3 rounded-lg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent border border-gray-200"
                        required
                        autoFocus
                    />
                    <input
                        type="text"
                        placeholder="Deskripsi (Opsional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="bg-gray-50 px-4 py-3 rounded-lg text-brand-text placeholder-brand-muted outline-none focus:ring-2 focus:ring-brand-accent border border-gray-200"
                    />
                    <button type="submit" className="bg-brand-primary text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                        Simpan Playlist
                    </button>
                </form>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <p className="text-red-500 text-center py-10 font-medium">{error}</p>
            ) : playlists.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-brand-muted mb-4 font-medium">Belum ada playlist.</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="text-brand-primary hover:text-brand-accent transition-colors text-sm font-bold"
                    >
                        Buat sekarang
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {playlists.map(p => (
                        <Link
                            key={p.id}
                            href={`/playlists/${p.id}`}
                            className="bg-white hover:shadow-md transition-shadow p-4 rounded-3xl group border border-gray-100 shadow-sm"
                        >
                            <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative">
                                {p.coverUrl ? (
                                    <Image src={p.coverUrl} alt={p.name} width={200} height={200} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <svg className="w-12 h-12 text-brand-muted" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="font-bold text-brand-text text-base truncate mb-1">{p.name}</h3>
                            <p className="text-sm font-medium text-brand-muted truncate block">
                                {p.totalSongs || 0} lagu
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
