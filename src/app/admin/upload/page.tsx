'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function AdminUploadPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [artistId, setArtistId] = useState('');
    const [durationSec, setDurationSec] = useState('');

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    const [uploadMode, setUploadMode] = useState<'manual' | 'youtube' | 'spotify' | 'batch_search'>('manual');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [spotifyUrl, setSpotifyUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]); // Array of URLs
    const [batchProcessing, setBatchProcessing] = useState<{ current: number; total: number; status: string } | null>(null);
    const [albumId, setAlbumId] = useState('');
    const [genre, setGenre] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState('');

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState<{ rawTitle: string; title: string; artists: any[]; thumbnail: string; duration: string } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== 'ADMIN') {
                router.replace('/songs');
            }
        }
    }, [user, authLoading, router]);

    async function uploadToR2(file: File, folder: 'audio' | 'covers'): Promise<{ objectKey: string; publicUrl: string | null }> {
        // 1. Dapatkan Pre-signed URL dari backend
        const { uploadUrl, objectKey, publicUrl } = await api.songs.getUploadUrl({
            fileName: file.name,
            fileType: file.type,
            folder
        });

        // 2. Upload file langsung ke R2
        const res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
            },
            body: file
        });

        if (!res.ok) throw new Error(`Gagal upload file ${file.name}`);

        return { objectKey, publicUrl };
    }

    async function handlePreview(e: React.FormEvent) {
        e.preventDefault();
        const isSpotify = uploadMode === 'spotify';
        const urlValue = isSpotify ? spotifyUrl : youtubeUrl;

        if (!urlValue) {
            setError(`Mohon lengkapi ${isSpotify ? 'Spotify' : 'YouTube'} URL.`);
            return;
        }

        setIsUploading(true);
        setError('');
        setProgressText(isSpotify ? 'Sedang mengambil metadata Spotify...' : 'Sedang menganalisis metadata via AI...');

        try {
            const data = isSpotify
                ? await api.songs.spotifyPreview({ spotifyUrl })
                : await api.songs.ytPreview({ youtubeUrl });

            setPreviewData({
                rawTitle: data.rawTitle,
                title: data.title,
                artists: data.artists,
                thumbnail: data.thumbnail,
                duration: data.duration
            });
            setShowPreviewModal(true);
        } catch (err: any) {
            setError(err.message || 'Gagal preview metadata.');
        } finally {
            setIsUploading(false);
            setProgressText('');
        }
    }

    async function handleFinalDownload() {
        if (!previewData) return;
        setIsUploading(true);
        setError('');
        setProgressText('Sedang mengunduh & mengunggah ke R2...');
        setShowPreviewModal(false);

        try {
            const commonData = {
                artistId: artistId || undefined,
                albumId: albumId || undefined,
                genre: genre || undefined,
                title: previewData.title,
                artistNames: Array.isArray(previewData.artists)
                    ? previewData.artists.map((a: any) => typeof a === 'string' ? a : a.name)
                    : []
            };

            if (uploadMode === 'spotify' || (typeof youtubeUrl === 'string' && youtubeUrl.includes('spotify.com'))) {
                await api.songs.spotifyDownload({
                    spotifyUrl: uploadMode === 'spotify' ? spotifyUrl : youtubeUrl,
                    ...commonData
                });
            } else {
                await api.songs.ytDownload({
                    youtubeUrl,
                    ...commonData
                });
            }

            setShowSuccessModal(true);
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat download.');
        } finally {
            setIsUploading(false);
            setProgressText('');
        }
    }

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchQuery) return;
        setIsUploading(true);
        setError('');
        try {
            // Use Spotify search as specifically requested
            const data = await api.songs.spotifySearch(searchQuery);
            setSearchResults(data.videos);
            setSelectedVideos([]);
        } catch (err: any) {
            setError(err.message || 'Gagal mencari di Spotify.');
        } finally {
            setIsUploading(false);
        }
    }

    async function handleBatchDownload() {
        if (selectedVideos.length === 0) return;

        setIsUploading(true);
        setError('');
        const total = selectedVideos.length;
        setBatchProcessing({ current: 0, total, status: 'Inisialisasi antrian...' });

        try {
            for (let i = 0; i < selectedVideos.length; i++) {
                const url = selectedVideos[i];
                const videoTitle = searchResults.find(v => v.url === url)?.title || 'Unknown Video';

                setBatchProcessing({
                    current: i + 1,
                    total,
                    status: `Men-download [${i + 1}/${total}]: ${videoTitle}`
                });

                // Detect source type
                if (url.includes('spotify.com')) {
                    await api.songs.spotifyDownload({
                        spotifyUrl: url,
                        artistId: artistId || undefined,
                        albumId: albumId || undefined,
                        genre: genre || undefined
                    });
                } else {
                    await api.songs.ytDownload({
                        youtubeUrl: url,
                        artistId: artistId || undefined,
                        albumId: albumId || undefined,
                        genre: genre || undefined
                    });
                }

                if (i < selectedVideos.length - 1) {
                    await sleep(1500); // Tunggu 1.5 detik antar request
                }
            }

            setBatchProcessing(null);
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error('[Batch Download Error]', err);
            const detailMsg = err.response?.data?.details || err.message;
            setError(`Error pada item #${batchProcessing?.current || 0}: ${detailMsg}`);
            setBatchProcessing(null);
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        if (uploadMode === 'youtube' || uploadMode === 'spotify') {
            handlePreview(e);
            return;
        }
        if (uploadMode === 'batch_search') {
            handleSearch(e);
            return;
        }
        e.preventDefault();

        if (uploadMode === 'manual') {
            if (!audioFile || !title || !artistId || !durationSec) {
                setError('Mohon lengkapi semua field wajib (+ file mp3).');
                return;
            }
        }

        setIsUploading(true);
        setError('');

        try {
            if (uploadMode === 'manual') {
                // 1. Upload Audio
                setProgressText('Mengunggah file audio...');
                const audioRes = await uploadToR2(audioFile!, 'audio');

                // 2. Upload Cover (Optional)
                let coverUrl = null;
                if (coverFile) {
                    setProgressText('Mengunggah cover...');
                    const coverRes = await uploadToR2(coverFile, 'covers');
                    coverUrl = coverRes.publicUrl;
                }

                // 3. Simpan Metadata ke Database
                setProgressText('Menyimpan metadata...');
                await api.songs.create({
                    title,
                    durationSec: Number(durationSec),
                    audioKey: audioRes.objectKey, // WAJIB untuk stream
                    coverUrl: coverUrl,
                    artistId,
                });

                setShowSuccessModal(true);
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            setIsUploading(false);
            setProgressText('');
        }
    }

    if (authLoading || !user || user.role !== 'ADMIN') {
        return <div className="min-h-screen" />; // Blank while redirecting
    }

    return (
        <div className="max-w-2xl mx-auto px-6 pt-12 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 mt-8">
                <div>
                    <h1 className="text-4xl font-black text-brand-text tracking-tight">Upload Lagu Baru</h1>
                    <p className="text-brand-muted font-medium mt-1">Admin Dashboard — Direct to Cloudflare R2 / YouTube Download</p>
                </div>
                <Link href="/admin/songs" className="bg-white border border-gray-200 text-brand-text font-black px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm text-sm">
                    <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    Kelola Semua Lagu
                </Link>
            </div>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setUploadMode('manual')}
                    className={`flex-1 py-3 font-semibold rounded-xl text-center transition-all ${uploadMode === 'manual' ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-brand-muted hover:bg-gray-200'}`}
                >
                    Manual Upload
                </button>
                <button
                    onClick={() => setUploadMode('youtube')}
                    className={`flex-1 py-3 font-semibold rounded-xl text-center transition-all ${uploadMode === 'youtube' ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-brand-muted hover:bg-gray-200'}`}
                >
                    YouTube Link
                </button>
                <button
                    onClick={() => setUploadMode('spotify')}
                    className={`flex-1 py-3 font-semibold rounded-xl text-center transition-all ${uploadMode === 'spotify' ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-brand-muted hover:bg-gray-200'}`}
                >
                    Spotify Link
                </button>
                <button
                    onClick={() => setUploadMode('batch_search')}
                    className={`flex-1 py-3 font-semibold rounded-xl text-center transition-all ${uploadMode === 'batch_search' ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-brand-muted hover:bg-gray-200'}`}
                >
                    Search Mode
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 font-medium shadow-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">

                {uploadMode === 'youtube' && (
                    <div>
                        <label className="block text-sm font-bold mb-2 text-brand-text">YouTube URL *</label>
                        <input
                            type="url"
                            value={youtubeUrl}
                            onChange={e => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtu.be/..."
                            className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                            required
                        />
                    </div>
                )}

                {uploadMode === 'spotify' && (
                    <div>
                        <label className="block text-sm font-bold mb-2 text-brand-text">Spotify URL *</label>
                        <input
                            type="url"
                            value={spotifyUrl}
                            onChange={e => setSpotifyUrl(e.target.value)}
                            placeholder="https://open.spotify.com/track/..."
                            className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                            required
                        />
                    </div>
                )}

                {uploadMode === 'manual' && (
                    <div>
                        <label className="block text-sm font-bold mb-2 text-brand-text">Judul Lagu *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                            required
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold mb-2 text-brand-text">
                        ID Artist {(uploadMode === 'youtube' || uploadMode === 'spotify') ? '(Opsional)' : '*'}
                    </label>
                    <input
                        type="text"
                        value={artistId}
                        onChange={e => setArtistId(e.target.value)}
                        placeholder={uploadMode === 'youtube' ? "Kosongkan untuk deteksi otomatis" : "e.g. artist-01"}
                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent font-mono transition-all"
                        required={uploadMode === 'manual'}
                    />
                    {(uploadMode === 'youtube' || uploadMode === 'spotify') && !artistId && (
                        <p className="mt-1.5 text-xs text-brand-muted font-medium">
                            💡 Nama artis akan otomatis diambil dari {uploadMode === 'spotify' ? 'Spotify' : 'YouTube'} jika dikosongkan.
                        </p>
                    )}
                </div>

                {uploadMode === 'manual' && (
                    <div>
                        <label className="block text-sm font-bold mb-2 text-brand-text">Durasi (Detik) *</label>
                        <input
                            type="number"
                            value={durationSec}
                            onChange={e => setDurationSec(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                            required
                            min="1"
                        />
                    </div>
                )}

                {(uploadMode === 'youtube' || uploadMode === 'spotify') && (
                    <>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-brand-text">ID Album (Opsional)</label>
                            <input
                                type="text"
                                value={albumId}
                                onChange={e => setAlbumId(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-brand-text">Genre (Opsional)</label>
                            <input
                                type="text"
                                value={genre}
                                onChange={e => setGenre(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                            />
                        </div>
                    </>
                )}

                {uploadMode === 'manual' && (
                    <>
                        <hr className="border-gray-100" />
                        <div>
                            <label className="block text-sm font-bold mb-2 text-brand-text">File Audio (.mp3, .wav) *</label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={e => setAudioFile(e.target.files?.[0] || null)}
                                className="w-full file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-brand-primary hover:file:bg-gray-200 file:transition-colors text-sm text-brand-muted font-medium cursor-pointer"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-brand-text">Cover Art (.jpg, .png)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setCoverFile(e.target.files?.[0] || null)}
                                className="w-full file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-brand-primary hover:file:bg-gray-200 file:transition-colors text-sm text-brand-muted font-medium cursor-pointer"
                            />
                        </div>
                    </>
                )}

                {uploadMode === 'batch_search' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-brand-text">Cari Lagu di Spotify</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Masukkan judul lagu atau artis..."
                                    className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="px-6 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                                >
                                    Cari
                                </button>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-xs font-bold text-brand-muted uppercase">
                                    <span>Hasil Pencarian</span>
                                    <span>{selectedVideos.length} Terpilih</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                                    {searchResults.map(video => {
                                        const isSelected = selectedVideos.includes(video.url);
                                        return (
                                            <div
                                                key={video.videoId}
                                                onClick={() => {
                                                    if (isSelected) setSelectedVideos(selectedVideos.filter(u => u !== video.url));
                                                    else setSelectedVideos([...selectedVideos, video.url]);
                                                }}
                                                className={`p-3 flex gap-3 items-center cursor-pointer transition-colors ${isSelected ? 'bg-brand-accent/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-gray-300'}`}>
                                                    {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <div className="w-16 h-10 relative rounded overflow-hidden shrink-0 shadow-sm bg-gray-200">
                                                    <Image src={video.thumbnail} alt="thumb" fill className="object-cover" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-brand-text font-bold truncate">{video.title}</p>
                                                    <p className="text-[10px] text-brand-muted font-medium truncate">{video.author} • {video.duration}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleBatchDownload}
                                        disabled={selectedVideos.length === 0 || isUploading}
                                        className="w-full btn-primary py-3 shadow-md disabled:opacity-50"
                                    >
                                        Download {selectedVideos.length} Lagu Sekaligus
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {uploadMode !== 'batch_search' && (
                    <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full btn-primary flex justify-center items-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
                    >
                        {isUploading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isUploading ? progressText : (uploadMode === 'manual' ? 'Upload Lagu' : 'Lanjutkan ke Preview')}
                    </button>
                )}
            </form>

            {/* Overlay Batch Processing */}
            {batchProcessing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 relative mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-brand-accent rounded-full border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xl">
                                {Math.round((batchProcessing.current / batchProcessing.total) * 100)}%
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Batch Processing</h2>
                        <p className="text-white/60 font-medium mb-8 leading-relaxed">{batchProcessing.status}</p>

                        <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mb-4">
                            <div
                                className="bg-brand-accent h-full transition-all duration-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                style={{ width: `${(batchProcessing.current / batchProcessing.total) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-white/40 uppercase font-black tracking-widest">
                            Item {batchProcessing.current} dari {batchProcessing.total}
                        </p>
                    </div>
                </div>
            )}

            {/* Modal Preview Metadata */}
            {showPreviewModal && previewData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h2 className="text-xl font-extrabold mb-4 text-brand-text">Konfirmasi Metadata</h2>

                            <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="w-20 h-20 relative rounded-xl overflow-hidden shrink-0 shadow-sm">
                                    <Image src={previewData.thumbnail} alt="Cover" fill className="object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider mb-1">Raw Metadata (Reference)</p>
                                    <p className="text-xs text-brand-text font-medium line-clamp-2 leading-relaxed italic">{previewData.rawTitle}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-muted uppercase mb-1.5 ml-1">Judul Lagu</label>
                                    <input
                                        type="text"
                                        value={previewData.title}
                                        onChange={e => setPreviewData({ ...previewData, title: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text font-semibold outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-muted uppercase mb-1.5 ml-1">Artis</label>
                                    <div className="space-y-2 max-h-[120px] overflow-y-auto mb-3">
                                        {(previewData.artists as any[]).map((artist, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                {artist.avatarUrl ? (
                                                    <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 shadow-sm">
                                                        <Image src={artist.avatarUrl} alt={artist.name} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">?</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-brand-text truncate">{artist.name}</p>
                                                    {artist.genres?.length > 0 && (
                                                        <p className="text-[9px] text-brand-muted truncate font-medium">{artist.genres.slice(0, 2).join(', ')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={(previewData.artists as any[]).map(a => typeof a === 'string' ? a : a.name).join(', ')}
                                        onChange={e => {
                                            const names = e.target.value.split(',').map(a => a.trim());
                                            setPreviewData({
                                                ...previewData,
                                                artists: names.map(n => {
                                                    const existing = (previewData.artists as any[]).find(ex => ex.name === n);
                                                    return existing || { name: n };
                                                })
                                            });
                                        }}
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-brand-text font-semibold outline-none focus:ring-2 focus:ring-brand-accent transition-all text-xs"
                                        placeholder="Edit nama artis jika diperlukan..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-brand-muted hover:bg-gray-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleFinalDownload}
                                    className="flex-[2] btn-primary py-3 shadow-lg hover:shadow-xl"
                                >
                                    Konfirmasi & Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Sukses */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-brand-text">Berhasil!</h2>
                        <p className="text-brand-muted font-medium mb-8">Lagu favorit Anda telah berhasil ditambahkan ke koleksi.</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/songs')}
                                className="w-full btn-primary py-4 text-base font-bold shadow-lg hover:shadow-xl"
                            >
                                Ke Daftar Lagu
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setTitle('');
                                    setYoutubeUrl('');
                                    setSpotifyUrl('');
                                    setSearchQuery('');
                                    setSelectedVideos([]);
                                    setAudioFile(null);
                                    setCoverFile(null);
                                    setArtistId('');
                                }}
                                className="w-full bg-gray-50 border border-gray-200 text-brand-text py-4 rounded-xl text-base font-bold hover:bg-gray-100 transition-colors"
                            >
                                Tambah Lagu Lain
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
