'use client';

import React, {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
    useEffect,
} from 'react';
import { get, set } from 'idb-keyval';
import { api, Song } from '@/lib/api';
import { getDominantColor } from '@/lib/utils';

interface PlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    isLoading: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    themeColor: string;
    sleepTimer: number | null; // seconds remaining
    setSleepTimer: (minutes: number | null) => void;
    queue: Song[];
    isShuffle: boolean;
    play: (song: Song, queue?: Song[], options?: { shuffle?: boolean }) => Promise<void>;
    pause: () => void;
    resume: () => void;
    next: () => void;
    prev: () => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    toggleShuffle: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [themeColor, setThemeColor] = useState('#1DB954'); // Spotify green default
    const [queue, setQueue] = useState<Song[]>([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [isShuffle, setIsShuffle] = useState(false);
    const [sleepTimer, setSleepTimerRemaining] = useState<number | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const PLAYER_STATE_KEY = 'player_state_v1';

    // Sleep Timer logic
    useEffect(() => {
        if (sleepTimer === null) return;
        if (sleepTimer <= 0) {
            pause();
            setSleepTimerRemaining(null);
            return;
        }

        const interval = setInterval(() => {
            setSleepTimerRemaining(prev => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [sleepTimer]);

    const setSleepTimer = useCallback((minutes: number | null) => {
        if (minutes === null) {
            setSleepTimerRemaining(null);
        } else {
            setSleepTimerRemaining(minutes * 60);
        }
    }, []);

    useEffect(() => {
        if (!currentSong?.coverUrl) {
            setThemeColor('#1DB954');
            return;
        }
        getDominantColor(currentSong.coverUrl).then(setThemeColor);
    }, [currentSong]);

    // Initialize Audio element once
    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = 1;
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    // (Moved the event listener effect to the bottom)
    useEffect(() => {
        let isMounted = true;
        (async () => {
            const saved = await get<{
                queue: Song[];
                currentSongId: string | null;
                currentTime: number;
                isShuffle: boolean;
            }>(PLAYER_STATE_KEY);
            if (!saved || !isMounted) return;

            setQueue(saved.queue || []);
            setIsShuffle(!!saved.isShuffle);

            if (saved.currentSongId && saved.queue?.length) {
                const song = saved.queue.find((s) => s.id === saved.currentSongId) || saved.queue[0];
                setCurrentSong(song || null);
                setQueueIndex(saved.queue.findIndex((s) => s.id === song?.id));

                const audio = audioRef.current;
                if (audio && song) {
                    try {
                        const { url } = await api.songs.streamUrl(song.id);
                        audio.src = url;
                        audio.currentTime = saved.currentTime || 0;
                    } catch (err) {
                        console.error('[Player] Failed to restore stream URL:', err);
                    }
                }
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    // Ambil signed URL dari backend, set ke audio element, lalu play
    const play = useCallback(async (song: Song, newQueue?: Song[], options?: { shuffle?: boolean }) => {
        const audio = audioRef.current;
        if (!audio) return;

        setIsLoading(true);
        setCurrentSong(song);

        if (newQueue) {
            setQueue(newQueue);
            setQueueIndex(newQueue.findIndex((s) => s.id === song.id));
        }

        if (options?.shuffle !== undefined) {
            setIsShuffle(options.shuffle);
        }

        try {
            // Pre-fetch signed URL concurrently with full details if possible, 
            // or just fetch full details first to ensure state is complete
            const [fullSong, { url }] = await Promise.all([
                api.songs.get(song.id),
                api.songs.streamUrl(song.id)
            ]);

            setCurrentSong(fullSong);

            audio.pause();
            audio.src = url; // stream langsung dari R2
            audio.currentTime = 0;
            await audio.play();
            // Track play count for "Top Play" section
            api.songs.trackPlay(song.id).catch(e => console.error('[Player] Error tracking play:', e));
        } catch (err) {
            console.error('[Player] Gagal memuat lagu:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const pause = useCallback(() => {
        audioRef.current?.pause();
    }, []);

    const resume = useCallback(() => {
        audioRef.current?.play();
    }, []);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    }, []);

    const setVolume = useCallback((vol: number) => {
        if (audioRef.current) {
            audioRef.current.volume = vol;
            setVolumeState(vol);
        }
    }, []);

    const toggleShuffle = useCallback(() => {
        setIsShuffle((prev) => !prev);
    }, []);

    const handleNext = useCallback(
        (audio?: HTMLAudioElement) => {
            setQueueIndex((prev) => {
                let nextIdx = prev + 1;

                if (isShuffle && queue.length > 1) {
                    // Pick a random index different from current
                    do {
                        nextIdx = Math.floor(Math.random() * queue.length);
                    } while (nextIdx === prev);
                }

                if (nextIdx < queue.length) {
                    play(queue[nextIdx], queue);
                    return nextIdx;
                } else if (isShuffle && queue.length > 0) {
                    // Default fallback if shuffle picked an out-of-bounds (shouldn't happen with random logic above, but type-safe)
                    play(queue[0], queue);
                    return 0;
                }
                return prev;
            });
        },
        [queue, play, isShuffle]
    );

    const next = useCallback(() => handleNext(), [handleNext]);

    const prev = useCallback(() => {
        const audio = audioRef.current;
        // Jika > 3 detik sudah main, restart; jika tidak, go prev
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        setQueueIndex((prev) => {
            const prevIdx = Math.max(0, prev - 1);
            if (prevIdx !== prev) {
                play(queue[prevIdx], queue);
            }
            return prevIdx;
        });
    }, [queue, play]);

    // Attach event listeners that depend on state/callbacks
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDurationChange = () => setDuration(audio.duration || 0);
        const onEnded = () => handleNext(audio);
        const onPause = () => setIsPlaying(false);
        const onPlay = () => setIsPlaying(true);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('durationchange', onDurationChange);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('play', onPlay);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('durationchange', onDurationChange);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('play', onPlay);
        };
    }, [handleNext]);

    useEffect(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            set(PLAYER_STATE_KEY, {
                queue,
                currentSongId: currentSong?.id || null,
                currentTime,
                isShuffle,
            }).catch((err) => console.error('[Player] Failed to persist state:', err));
        }, 800);
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [queue, currentSong, currentTime, isShuffle]);

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                isPlaying,
                isLoading,
                currentTime,
                duration,
                volume,
                themeColor,
                sleepTimer,
                setSleepTimer,
                queue,
                isShuffle,
                play,
                pause,
                resume,
                next,
                prev,
                seek,
                setVolume,
                toggleShuffle,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error('usePlayer harus dipakai di dalam <PlayerProvider>');
    return ctx;
}
