'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Song } from '@/lib/api';
import { usePlayer } from '@/context/PlayerContext';
import PlaylistModal from './PlaylistModal';

interface SongCardProps {
    song: Song;
    onPlay: () => void;
    onClick: () => void;
    onDownload?: () => void;
}

export default function SongCard({ song, onPlay, onClick, onDownload }: SongCardProps) {
    const { currentSong, isPlaying } = usePlayer();
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const isActive = currentSong?.id === song.id;

    return (
        <div
            className={`flex items-center gap-3 px-2.5 sm:px-3 py-2.5 rounded-xl transition-all cursor-pointer group
        ${isActive ? 'bg-white shadow-md border-brand-accent/30' : 'bg-transparent hover:bg-white hover:shadow-sm'} border border-transparent`}
        >
            {/* Cover — clicking navigates to detail */}
            <button
                onClick={onClick}
                className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm"
                aria-label={`Lihat detail ${song.title}`}
            >
                {song.coverUrl ? (
                    <Image src={song.coverUrl} alt={song.title} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                    <svg className="w-6 h-6 text-brand-muted" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                )}
            </button>

            {/* Song info — clicking navigates to detail */}
            <button className="flex-1 min-w-0 text-left" onClick={onClick} aria-label={song.title}>
                <p className={`font-bold truncate ${isActive ? 'text-brand-primary' : 'text-brand-text'}`}>
                    {song.title}
                </p>
                <p className="text-brand-muted font-medium text-sm truncate">
                    {song.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
                </p>
                <p className="text-brand-muted text-xs mt-0.5 sm:hidden">{song.duration}</p>
            </button>

            {/* Duration */}
            <span className="text-brand-muted text-sm shrink-0 hidden sm:inline">{song.duration}</span>

            {/* Add to Playlist Button */}
            <button
                onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}
                className="w-10 h-10 rounded-full items-center justify-center shrink-0 transition-all hidden sm:flex
                         bg-gray-50 text-brand-muted hover:bg-gray-100 hover:text-brand-text opacity-0 group-hover:opacity-100"
                aria-label="Tambah ke playlist"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </button>

            {onDownload && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                    className="w-10 h-10 rounded-full items-center justify-center shrink-0 transition-all hidden sm:flex
                         bg-gray-50 text-brand-muted hover:bg-gray-100 hover:text-brand-text opacity-0 group-hover:opacity-100"
                    aria-label="Unduh untuk offline"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                    </svg>
                </button>
            )}

            {/* Play button */}
            <button
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-brand-primary hover:bg-brand-primary hover:text-white hover:shadow-md'}`}
                aria-label={`Putar ${song.title}`}
            >
                {isActive && isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            {showPlaylistModal && (
                <PlaylistModal songId={song.id} onClose={() => setShowPlaylistModal(false)} />
            )}
        </div>
    );
}
