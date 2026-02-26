export interface AppUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: string;
    createdAt?: string;
    _count?: {
        playlists: number;
        playHistory: number;
    };
}

export interface Artist {
    id: string;
    name: string;
    avatarUrl: string | null;
}

export interface Album {
    id: string;
    title: string;
    coverUrl: string | null;
}

export interface Song {
    id: string;
    title: string;
    durationSec: number;
    duration: string;
    coverUrl: string | null;
    genre: string | null;
    lyrics: string | null;
    lyricsLrc: string | null;
    moods: string[];
    playCount: number;
    trackNumber: number | null;
    artists: Artist[];
    album: Album | null;
}

export interface Playlist {
    id: string;
    name: string;
    description: string | null;
    coverUrl: string | null;
    totalSongs?: number;
    hasSong?: boolean;
}

export interface PlaylistDetail extends Playlist {
    owner: { id: string; name: string };
    totalSongs: number;
    songs: Array<{
        position: number;
        addedAt: string;
        song: Song;
    }>;
}

export interface YTPreviewResponse {
    rawTitle: string;
    title: string;
    artists: string[];
    thumbnail: string;
    duration: string;
}

export interface YTSearchResponse {
    videos: Array<{
        videoId: string;
        url: string;
        title: string;
        thumbnail: string;
        duration: string;
        author: string;
    }>;
}
