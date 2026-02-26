'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Song {
    id: string;
    title: string;
    artists: Array<{ id: string; name: string }>;
    genre: string | null;
    coverUrl: string | null;
    lyrics?: string | null;
    lyricsLrc?: string | null;
    moods?: string[];
    album?: { id: string; title: string } | null;
}

interface EditSongModalProps {
    song: Song;
    onClose: () => void;
    onSuccess: (updatedSong: Song) => void;
}

export default function EditSongModal({ song, onClose, onSuccess }: EditSongModalProps) {
    const [title, setTitle] = useState(song.title);
    const [genre, setGenre] = useState(song.genre || '');
    const [artistNames, setArtistNames] = useState(song.artists.map(a => a.name).join(', '));
    const [lyrics, setLyrics] = useState(song.lyrics || '');
    const [lyricsLrc, setLyricsLrc] = useState(song.lyricsLrc || '');
    const [moods, setMoods] = useState(song.moods?.join(', ') || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Jika song dari prop tidak punya lirik (biasa terjadi karena list tidak fetch lirik),
        // maka kita ambil data lengkapnya.
        if (song.id) {
            api.songs.get(song.id).then(fullSong => {
                if (fullSong.lyrics) setLyrics(fullSong.lyrics);
                if (fullSong.lyricsLrc) setLyricsLrc(fullSong.lyricsLrc);
                if (fullSong.moods) setMoods(fullSong.moods.join(', '));
            }).catch(err => console.error('[EditSongModal] Gagal fetch lirik:', err));
        }
    }, [song.id]);

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const result = await api.songs.generateLyrics(song.id);
            if (result.lyrics) setLyrics(result.lyrics);
            if (result.lyricsLrc) setLyricsLrc(result.lyricsLrc);
            if (result.moods) setMoods(result.moods.join(', '));
        } catch (err: any) {
            setError('AI Gagal: ' + (err.message || 'Lirik tidak ditemukan.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            // Kita kirim string artis, tapi backend butuh IDs atau names?
            // Dari PATCH implementation kita: 
            // if (artistIds && Array.isArray(artistIds)) { updateData.artists = { set: artistIds.map(id => ({ id })) }; }
            // Tapi problemnya kita tidak punya artistIds baru jika user mengetik nama baru.
            // Untuk simplifikasi, kita asumsikan user hanya mengedit judul/genre dsb dulu.
            // Atau kita bisa gunakan mekanisme yang sama dengan upload: cari artist by name.
            // Mari kita update backend PATCH untuk handle artistNames string[] juga agar lebih fleksibel

            const updatedData = {
                title,
                genre,
                lyrics,
                lyricsLrc,
                moods: moods.split(',').map(m => m.trim()).filter(Boolean),
                artistNames: artistNames.split(',').map(n => n.trim()).filter(Boolean)
            };

            const res = await api.songs.update(song.id, updatedData);
            onSuccess(res.song);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan perubahan.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-black text-brand-text tracking-tight">Edit Detail Lagu</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-black text-brand-muted uppercase tracking-widest mb-2 ml-1">Judul Lagu</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-brand-muted uppercase tracking-widest mb-2 ml-1">Artis (pisahkan dengan koma)</label>
                        <input
                            type="text"
                            value={artistNames}
                            onChange={e => setArtistNames(e.target.value)}
                            required
                            placeholder="Contoh: Tulus, Raisa"
                            className="w-full bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-brand-muted uppercase tracking-widest mb-2 ml-1">Genre</label>
                        <input
                            type="text"
                            value={genre}
                            onChange={e => setGenre(e.target.value)}
                            placeholder="e.g. Pop, Jazz"
                            className="w-full bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label className="block text-xs font-black text-brand-muted uppercase tracking-widest">Lirik & Mood (AI)</label>
                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                                <svg className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {isGenerating ? 'Mencari...' : 'Gunakan AI'}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={moods}
                            onChange={e => setMoods(e.target.value)}
                            placeholder="Relax, Focus, Happy..."
                            className="w-full bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium mb-3"
                        />
                        <textarea
                            value={lyricsLrc}
                            onChange={e => setLyricsLrc(e.target.value)}
                            placeholder="LRC Format [00:12.34]..."
                            className="w-full bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium h-24 mb-3 text-xs font-mono"
                        />
                        <textarea
                            value={lyrics}
                            onChange={e => setLyrics(e.target.value)}
                            placeholder="Lirik teks biasa..."
                            className="w-full bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium h-32 text-xs"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 border border-gray-200 text-brand-muted font-black rounded-2xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 btn-primary py-4 shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
