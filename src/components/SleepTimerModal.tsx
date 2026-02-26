'use client';

import { usePlayer } from '@/context/PlayerContext';

interface SleepTimerModalProps {
    onClose: () => void;
}

export default function SleepTimerModal({ onClose }: SleepTimerModalProps) {
    const { setSleepTimer, sleepTimer } = usePlayer();

    const options = [
        { label: 'Matikan', value: null },
        { label: '5 Menit', value: 5 },
        { label: '15 Menit', value: 15 },
        { label: '30 Menit', value: 30 },
        { label: '1 Jam', value: 60 },
        { label: 'Akhir Lagu', value: -1 }, // -1 can be a special flag to stop after current song
    ];

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <h3 className="text-xl font-extrabold text-brand-text mb-2 text-center">Sleep Timer</h3>
                {sleepTimer !== null && (
                    <p className="text-brand-primary text-sm font-bold text-center mb-6">
                        Berhenti dalam {formatTime(sleepTimer)}
                    </p>
                )}

                <div className="space-y-2">
                    {options.map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => {
                                setSleepTimer(opt.value);
                                onClose();
                            }}
                            className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all ${(sleepTimer === null && opt.value === null) || (opt.value && sleepTimer === opt.value * 60)
                                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]'
                                    : 'bg-gray-50 text-brand-text hover:bg-gray-100'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 text-sm font-bold text-brand-muted hover:text-brand-text transition-colors"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}
