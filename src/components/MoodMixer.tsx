import { Song } from '@/lib/api';

type MoodMix = {
    mood: string;
    title: string;
    description: string;
    songs: Song[];
    accent: string;
};

export default function MoodMixer({
    mixes,
    onPlayMix,
}: {
    mixes: MoodMix[];
    onPlayMix: (songs: Song[]) => void;
}) {
    if (mixes.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-2xl text-brand-text">Mood Mix</h2>
                <span className="text-[10px] font-black tracking-widest uppercase text-brand-muted">Quick sessions</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                {mixes.map((mix) => (
                    <div
                        key={mix.mood}
                        className={`min-w-[240px] rounded-[2rem] border border-gray-100 p-4 shadow-sm ${mix.accent}`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{mix.mood}</p>
                                <h3 className="font-black text-xl text-white leading-tight mt-1">{mix.title}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-black">
                                {mix.songs.length}
                            </div>
                        </div>
                        <p className="text-white/80 text-xs mt-3 leading-relaxed">{mix.description}</p>
                        <div className="mt-4 flex items-center gap-2">
                            {mix.songs.slice(0, 3).map((song) => (
                                <div key={song.id} className="w-10 h-10 rounded-xl overflow-hidden border border-white/30">
                                    <img src={song.coverUrl || 'https://placehold.co/200x200'} className="w-full h-full object-cover" alt={song.title} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => onPlayMix(mix.songs)}
                            className="mt-4 w-full bg-white text-brand-text font-black text-xs py-2 rounded-full hover:scale-[1.01] transition"
                        >
                            Play Next
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
