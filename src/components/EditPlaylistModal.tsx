'use client';

import { useState, useRef } from 'react';
import { api, Playlist } from '@/lib/api';
import Image from 'next/image';

interface EditPlaylistModalProps {
    playlist: Playlist;
    onClose: () => void;
    onSuccess: (updated: Playlist) => void;
}

export default function EditPlaylistModal({ playlist, onClose, onSuccess }: EditPlaylistModalProps) {
    const [name, setName] = useState(playlist.name);
    const [description, setDescription] = useState(playlist.description || '');
    const [coverUrl, setCoverUrl] = useState(playlist.coverUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // Re-use the existing upload-url logic
            const { uploadUrl, publicUrl } = await api.songs.getUploadUrl({
                fileName: file.name,
                fileType: file.type,
                folder: 'covers'
            });

            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (publicUrl) {
                setCoverUrl(publicUrl);
            }
        } catch (err: any) {
            setError('Gagal mengunggah foto.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const res = await api.playlists.update(playlist.id, {
                name,
                description,
                coverUrl
            });
            onSuccess(res.playlist);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan perubahan.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-brand-text tracking-tight">Edit Playlist</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Cover Photo */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-40 h-40 bg-gray-50 rounded-3xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {coverUrl ? (
                                <Image src={coverUrl} alt="Cover" fill className="object-cover group-hover:opacity-60 transition-opacity" />
                            ) : (
                                <svg className="w-16 h-16 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                                </svg>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-black uppercase tracking-widest">Ganti Foto</span>
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUpload}
                            hidden
                            accept="image/*"
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2 ml-1">Nama Playlist</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-50 px-5 py-4 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 border border-transparent focus:border-brand-primary/20 transition-all font-bold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2 ml-1">Deskripsi</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-50 px-5 py-4 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 border border-transparent focus:border-brand-primary/20 transition-all font-medium h-24 resize-none"
                                placeholder="Ceritakan tentang playlist ini..."
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-50 text-brand-muted font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isUploading}
                            className="flex-1 btn-primary py-4 shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
