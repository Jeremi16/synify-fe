type DownloadState = {
    isOpen: boolean;
    title: string;
    total: number;
    completed: number;
    failed: number;
    storageUsed?: number | null;
    storageQuota?: number | null;
    error?: string | null;
};

export default function DownloadSessionModal({
    state,
    onClose,
}: {
    state: DownloadState;
    onClose: () => void;
}) {
    if (!state.isOpen) return null;

    const progress = state.total > 0 ? Math.round((state.completed / state.total) * 100) : 0;
    const storageLabel = state.storageUsed && state.storageQuota
        ? `${Math.round(state.storageUsed / 1024 / 1024)}MB / ${Math.round(state.storageQuota / 1024 / 1024)}MB`
        : 'Estimating...';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-lg text-brand-text">{state.title}</h3>
                    <button onClick={onClose} className="text-xs font-black text-brand-muted hover:text-brand-text">Close</button>
                </div>
                <p className="text-xs text-brand-muted mb-4">Offline session download</p>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-brand-primary" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-brand-muted mt-2">
                    <span>{state.completed} / {state.total} tracks</span>
                    <span>{progress}%</span>
                </div>

                <div className="mt-4 text-[11px] text-brand-muted">
                    Storage: {storageLabel}
                </div>

                {state.failed > 0 && (
                    <div className="mt-3 text-[11px] text-red-500">
                        {state.failed} track(s) failed to cache.
                    </div>
                )}

                {state.error && (
                    <div className="mt-3 text-[11px] text-red-500">
                        {state.error}
                    </div>
                )}
            </div>
        </div>
    );
}
