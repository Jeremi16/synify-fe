import type {
    AppUser,
    Song,
    Playlist,
    PlaylistDetail,
    YTPreviewResponse,
    YTSearchResponse,
} from './types';

const MOCK_STREAM_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const mockArtists = [
    { id: 'a1', name: 'Neon Plains', avatarUrl: null },
    { id: 'a2', name: 'Analog Youth', avatarUrl: null },
    { id: 'a3', name: 'Sundown Kites', avatarUrl: null },
];

const mockSongs: Song[] = [
    {
        id: 's1',
        title: 'City Glow',
        durationSec: 214,
        duration: '3:34',
        coverUrl: 'https://placehold.co/600x600?text=City+Glow',
        genre: 'Electronic',
        lyrics: null,
        lyricsLrc: null,
        moods: ['Focus', 'Energetic'],
        playCount: 1200,
        trackNumber: 1,
        artists: [mockArtists[0]],
        album: { id: 'al1', title: 'Midnight Drive', coverUrl: null },
    },
    {
        id: 's2',
        title: 'Blue Haze',
        durationSec: 198,
        duration: '3:18',
        coverUrl: 'https://placehold.co/600x600?text=Blue+Haze',
        genre: 'Chill',
        lyrics: null,
        lyricsLrc: null,
        moods: ['Relax'],
        playCount: 980,
        trackNumber: 2,
        artists: [mockArtists[1]],
        album: { id: 'al2', title: 'Soft Signals', coverUrl: null },
    },
    {
        id: 's3',
        title: 'Quiet Motion',
        durationSec: 245,
        duration: '4:05',
        coverUrl: 'https://placehold.co/600x600?text=Quiet+Motion',
        genre: 'Ambient',
        lyrics: null,
        lyricsLrc: null,
        moods: ['Relax', 'Focus'],
        playCount: 650,
        trackNumber: 3,
        artists: [mockArtists[2]],
        album: { id: 'al3', title: 'Evening Lines', coverUrl: null },
    },
    {
        id: 's4',
        title: 'Pulse Runner',
        durationSec: 221,
        duration: '3:41',
        coverUrl: 'https://placehold.co/600x600?text=Pulse+Runner',
        genre: 'Synthwave',
        lyrics: null,
        lyricsLrc: null,
        moods: ['Energetic'],
        playCount: 1520,
        trackNumber: 4,
        artists: [mockArtists[0]],
        album: { id: 'al1', title: 'Midnight Drive', coverUrl: null },
    },
    {
        id: 's5',
        title: 'Morning Mist',
        durationSec: 189,
        duration: '3:09',
        coverUrl: 'https://placehold.co/600x600?text=Morning+Mist',
        genre: 'Lo-Fi',
        lyrics: null,
        lyricsLrc: null,
        moods: ['Focus', 'Relax'],
        playCount: 840,
        trackNumber: 5,
        artists: [mockArtists[1]],
        album: { id: 'al2', title: 'Soft Signals', coverUrl: null },
    },
];

const mockUser: AppUser = {
    id: 'u1',
    email: 'demo@mock.local',
    name: 'Demo User',
    avatarUrl: null,
    role: 'user',
};

const mockPlaylists: Playlist[] = [
    { id: 'p1', name: 'Late Night', description: 'Chill focus mix', coverUrl: null, totalSongs: 3 },
];

function filterSongs(params?: { genre?: string; q?: string; sort?: string; mood?: string; limit?: number; offset?: number }) {
    let items = [...mockSongs];
    if (params?.q) {
        const q = params.q.toLowerCase();
        items = items.filter((s) => s.title.toLowerCase().includes(q) || s.artists.some(a => a.name.toLowerCase().includes(q)));
    }
    if (params?.mood) {
        items = items.filter((s) => s.moods.includes(params.mood!));
    }
    if (params?.sort === 'plays') {
        items.sort((a, b) => b.playCount - a.playCount);
    }
    if (params?.sort === 'latest') {
        items = items.slice().reverse();
    }
    if (params?.limit) {
        items = items.slice(0, params.limit);
    }
    return items;
}

export const mockApi = {
    auth: {
        login: async () => ({ token: 'mock-token', user: mockUser }),
        me: async () => ({ user: mockUser }),
    },

    songs: {
        list: async (params?: { genre?: string; q?: string; sort?: string; mood?: string; limit?: number; offset?: number }) => {
            return { songs: filterSongs(params) };
        },
        get: async (id: string) => {
            const song = mockSongs.find((s) => s.id === id);
            if (!song) throw new Error('Song not found');
            return song;
        },
        trackPlay: async () => ({}),
        generateLyrics: async (id: string) => {
            const song = mockSongs.find((s) => s.id === id);
            if (!song) throw new Error('Song not found');
            return { ...song, lyrics: 'Mock lyrics', lyricsLrc: null };
        },
        streamUrl: async (id: string) => {
            const song = mockSongs.find((s) => s.id === id);
            if (!song) throw new Error('Song not found');
            return { url: MOCK_STREAM_URL, expiresIn: 3600, songId: id, title: song.title };
        },
        download: async (ids: string[]) => {
            const items = ids.map((id) => {
                const song = mockSongs.find((s) => s.id === id)!;
                return { song, url: MOCK_STREAM_URL, expiresIn: 3600 };
            });
            return { items };
        },
        ytSearch: async () => ({ videos: [] }),
        update: async (id: string, data: any) => ({ song: { ...(mockSongs.find(s => s.id === id) as Song), ...data } }),
        delete: async () => ({}),
        ytPreview: async () => ({ rawTitle: '', title: '', artists: [], thumbnail: '', duration: '' } as YTPreviewResponse),
        ytDownload: async () => ({ song: mockSongs[0] }),
        spotifySearch: async () => ({ videos: [] } as YTSearchResponse),
        spotifyPreview: async () => ({ rawTitle: '', title: '', artists: [], thumbnail: '', duration: '' } as YTPreviewResponse),
        spotifyDownload: async () => ({ song: mockSongs[0] }),
        getUploadUrl: async () => ({ uploadUrl: '', objectKey: '', publicUrl: null, expiresIn: 3600 }),
        create: async (data: any) => ({ song: { ...mockSongs[0], ...data } }),
    },

    playlists: {
        create: async (data: { name: string; description?: string }) => ({
            playlist: { id: 'p2', name: data.name, description: data.description || null, coverUrl: null },
        }),
        my: async () => ({ playlists: mockPlaylists }),
        get: async (id: string) => {
            const playlist = mockPlaylists.find((p) => p.id === id);
            if (!playlist) throw new Error('Playlist not found');
            const detail: PlaylistDetail = {
                ...playlist,
                owner: { id: mockUser.id, name: mockUser.name },
                totalSongs: 3,
                songs: mockSongs.slice(0, 3).map((song, idx) => ({
                    position: idx + 1,
                    addedAt: new Date().toISOString(),
                    song,
                })),
            };
            return detail;
        },
        addSong: async () => ({}),
        update: async (id: string, data: { name?: string; description?: string; coverUrl?: string }) => ({
            playlist: { id, name: data.name || 'Updated', description: data.description || null, coverUrl: data.coverUrl || null },
        }),
        delete: async () => ({}),
    },
};
