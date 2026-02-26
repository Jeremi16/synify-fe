'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import PlaylistModal from './PlaylistModal';
import LyricsPlayer from './LyricsPlayer';
import SleepTimerModal from './SleepTimerModal';

export default function MiniPlayer() {
    const {
        currentSong,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        pause,
        resume,
        next,
        prev,
        seek,
        isShuffle,
        toggleShuffle,
        themeColor,
        sleepTimer,
    } = usePlayer();
    const router = useRouter();
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSleepTimer, setShowSleepTimer] = useState(false);

    // Tidak tampil jika tidak ada lagu yang dipilih
    if (!currentSong) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Full Screen Player Expansion */}
            <div
                className={`fixed inset-0 z-[55] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
                    }`}
                style={{
                    background: `linear-gradient(to bottom, ${themeColor} 0%, #ffffff 100%)`
                }}
            >
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />

                <div className="relative h-full flex flex-col px-8 pt-16 pb-12 max-w-2xl mx-auto">
                    {/* Top Bar */}
                    <header className="flex items-center justify-between mb-10">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-3 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                        >
                            <svg className="w-6 h-6 text-brand-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-muted mb-1">PLAYING FROM</p>
                            <p className="text-xs font-bold text-brand-text truncate max-w-[150px]">{currentSong.title}</p>
                        </div>
                        <button
                            onClick={() => setShowSleepTimer(true)}
                            className={`p-3 bg-white/20 rounded-full hover:bg-white/40 transition-colors ${sleepTimer ? 'text-brand-primary' : 'text-brand-text'}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </header>

                    {/* Content Area - Lyrics Player */}
                    <div className="flex-1 min-h-0">
                        <LyricsPlayer
                            lrc={currentSong.lyricsLrc || ''}
                            currentTime={currentTime}
                            themeColor={themeColor}
                        />
                    </div>

                    {/* Bottom Info & Controls */}
                    <footer className="mt-8 space-y-8">
                        <div className="flex items-end justify-between gap-6">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl font-black text-brand-text mb-2 leading-tight truncate">{currentSong.title}</h1>
                                <p className="text-xl font-bold text-brand-muted truncate">
                                    {currentSong.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
                                </p>
                            </div>
                            <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white shrink-0 rotate-3">
                                {currentSong.coverUrl && (
                                    <Image
                                        src={currentSong.coverUrl}
                                        alt={currentSong.title}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Progress */}
                        <div>
                            <div
                                className="h-2 bg-black/5 rounded-full mb-3 cursor-pointer relative overflow-hidden"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const ratio = (e.clientX - rect.left) / rect.width;
                                    seek(ratio * duration);
                                }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%`, backgroundColor: themeColor }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-black tracking-widest text-brand-muted">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Main Controls */}
                        <div className="flex items-center justify-between">
                            <button onClick={toggleShuffle} className={`p-4 ${isShuffle ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'}`}>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                                </svg>
                            </button>
                            <button onClick={prev} className="p-4 text-brand-text hover:scale-110 active:scale-95 transition-transform">
                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                            </button>
                            <button
                                onClick={isPlaying ? pause : resume}
                                className="w-24 h-24 shrink-0 rounded-full flex items-center justify-center shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-transform bg-brand-primary text-white"
                            >
                                {isPlaying ? (
                                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg className="w-10 h-10 ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                )}
                            </button>
                            <button onClick={next} className="p-4 text-brand-text hover:scale-110 active:scale-95 transition-transform">
                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                            </button>
                            <button onClick={() => setShowPlaylistModal(true)} className="p-4 text-brand-muted hover:text-brand-text">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Bottom Bar Player */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 
                     bg-white/95 backdrop-blur-md
                     border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]"
            >
                {/* Progress bar */}
                <div
                    className="h-1 bg-gray-200 cursor-pointer relative"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const ratio = (e.clientX - rect.left) / rect.width;
                        seek(ratio * duration);
                    }}
                    role="slider"
                    aria-label="Progress"
                    aria-valuenow={Math.round(currentTime)}
                    aria-valuemax={Math.round(duration)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowRight') seek(Math.min(currentTime + 5, duration));
                        if (e.key === 'ArrowLeft') seek(Math.max(currentTime - 5, 0));
                    }}
                >
                    <div
                        className="h-full bg-brand-accent transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Player controls */}
                <div className="flex items-center gap-4 px-6 py-4 max-w-5xl mx-auto">
                    {/* Cover — navigate to detail */}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                        aria-label="Tampilkan detail player"
                    >
                        {currentSong.coverUrl ? (
                            <Image
                                src={currentSong.coverUrl}
                                alt={currentSong.title}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <svg className="w-6 h-6 text-brand-muted" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        )}
                    </button>

                    {/* Song info */}
                    <div className="flex-1 min-w-0" onClick={() => setIsExpanded(true)}>
                        <div className="flex items-center gap-2">
                            <p className="text-brand-text text-base font-bold truncate">{currentSong.title}</p>
                        </div>
                        <p className="text-brand-muted text-sm font-medium truncate">
                            {currentSong.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Expand/Lyrics button */}
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full text-brand-muted hover:text-brand-primary transition-colors hover:bg-gray-100"
                            aria-label="Tampilkan lirik"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </button>

                        {/* Prev */}
                        <button
                            onClick={prev}
                            className="w-10 h-10 flex items-center justify-center rounded-full text-brand-muted hover:text-brand-primary transition-colors hover:bg-gray-100 hidden sm:flex"
                            aria-label="Sebelumnya"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                            </svg>
                        </button>

                        {/* Play / Pause / Loading */}
                        <button
                            onClick={isPlaying ? pause : resume}
                            disabled={isLoading}
                            className="w-12 h-12 shrink-0 rounded-full bg-brand-primary flex items-center justify-center shadow-md
                       hover:scale-105 active:scale-95 transition-transform disabled:opacity-60 text-white"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 shrink-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isPlaying ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={next}
                            className="w-10 h-10 flex items-center justify-center rounded-full text-brand-muted hover:text-brand-primary transition-colors hover:bg-gray-100"
                            aria-label="Berikutnya"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {showPlaylistModal && (
                <PlaylistModal songId={currentSong.id} onClose={() => setShowPlaylistModal(false)} />
            )}

            {showSleepTimer && (
                <SleepTimerModal onClose={() => setShowSleepTimer(false)} />
            )}
        </>
    );
}
