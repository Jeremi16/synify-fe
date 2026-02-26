/**
 * Centralized API fetch helper
 * Semua request ke backend menggunakan fungsi ini.
 */

import type {
    AppUser,
    Song,
    Playlist,
    PlaylistDetail,
    YTPreviewResponse,
    YTSearchResponse,
} from './types';
import { mockApi } from './mockApi';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
}

interface FetchOptions extends RequestInit {
    auth?: boolean; // apakah perlu attach JWT token? default: true
}

export async function apiFetch<T = unknown>(
    path: string,
    options: FetchOptions = {}
): Promise<T> {
    const { auth = true, headers = {}, ...rest } = options;

    const token = getToken();
    const authHeaders: Record<string, string> =
        auth && token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...(headers as Record<string, string>),
        },
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        const message = err.details ? `${err.error}: ${err.details}` : (err.error || `HTTP ${response.status}`);
        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

// ── Typed API calls ─────────────────────────────────────────────────────────

const realApi = {
    auth: {
        login: (idToken: string) =>
            apiFetch<{ token: string; user: AppUser }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ idToken }),
                auth: false,
            }),
        me: () => apiFetch<{ user: AppUser }>('/auth/me'),
    },

    songs: {
        list: (params?: { genre?: string; q?: string; sort?: string; mood?: string; limit?: number; offset?: number }) => {
            const qs = new URLSearchParams(
                Object.entries(params || {})
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => [k, String(v)])
            ).toString();
            return apiFetch<{ songs: Song[] }>(`/songs${qs ? `?${qs}` : ''}`);
        },
        get: (id: string) => apiFetch<Song>(`/songs/${id}`),
        trackPlay: (id: string) => apiFetch(`/songs/${id}/play`, { method: 'POST' }),
        generateLyrics: (id: string) => apiFetch<Song>(`/songs/${id}/generate-lyrics`, { method: 'POST' }),
        streamUrl: (id: string) =>
            apiFetch<{ url: string; expiresIn: number; songId: string; title: string }>(
                `/songs/${id}/stream-url`,
                { method: 'POST' }
            ),
        download: (ids: string[]) =>
            apiFetch<{ items: Array<{ song: Song; url: string; expiresIn: number }> }>(
                `/songs/download?ids=${encodeURIComponent(ids.join(','))}`
            ),

        // ADMIN ONLY
        ytSearch: (q: string) =>
            apiFetch<YTSearchResponse>(`/songs/yt-search?q=${encodeURIComponent(q)}`),
        update: (id: string, data: any) =>
            apiFetch<{ song: Song }>(`/songs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) =>
            apiFetch(`/songs/${id}`, { method: 'DELETE' }),
        ytPreview: (data: { youtubeUrl: string }) =>
            apiFetch<YTPreviewResponse>('/songs/yt-preview', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        ytDownload: (data: { youtubeUrl: string; artistId?: string; albumId?: string; genre?: string; title?: string; artistNames?: string[] }) =>
            apiFetch<{ song: Song }>('/songs/yt-download', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        spotifySearch: (q: string) =>
            apiFetch<YTSearchResponse>(`/songs/spotify-search?q=${encodeURIComponent(q)}`),
        spotifyPreview: (data: { spotifyUrl: string }) =>
            apiFetch<YTPreviewResponse>('/songs/spotify-preview', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        spotifyDownload: (data: { spotifyUrl: string; artistId?: string; albumId?: string; genre?: string; title?: string; artistNames?: string[] }) =>
            apiFetch<{ song: Song }>('/songs/spotify-download', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        getUploadUrl: (data: { fileName: string; fileType: string; folder?: 'audio' | 'covers' }) =>
            apiFetch<{ uploadUrl: string; objectKey: string; publicUrl: string | null; expiresIn: number }>('/songs/upload-url', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        create: (data: any) =>
            apiFetch<{ song: Song }>('/songs', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    playlists: {
        create: (data: { name: string; description?: string }) =>
            apiFetch<{ playlist: Playlist }>('/playlists', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        my: (songId?: string) => apiFetch<{ playlists: Playlist[] }>(`/playlists/my${songId ? `?songId=${songId}` : ''}`),
        get: (id: string) => apiFetch<PlaylistDetail>(`/playlists/${id}`),
        addSong: (playlistId: string, songId: string) =>
            apiFetch(`/playlists/${playlistId}/songs`, {
                method: 'POST',
                body: JSON.stringify({ songId }),
            }),
        update: (id: string, data: { name?: string; description?: string; coverUrl?: string }) =>
            apiFetch<{ playlist: Playlist }>(`/playlists/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            apiFetch(`/playlists/${id}`, {
                method: 'DELETE',
            }),
    },
};

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
export const api = useMock ? mockApi : realApi;

// -- Shared types ---------------------------------------------------------
export type {
    AppUser,
    Song,
    Playlist,
    PlaylistDetail,
    YTPreviewResponse,
    YTSearchResponse,
};
