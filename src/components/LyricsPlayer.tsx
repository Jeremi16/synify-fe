'use client';

import { useEffect, useState, useRef } from 'react';

interface LyricLine {
    time: number;
    text: string;
}

interface LyricsPlayerProps {
    lrc: string;
    currentTime: number;
    themeColor?: string;
}

export default function LyricsPlayer({ lrc, currentTime, themeColor = '#1DB954' }: LyricsPlayerProps) {
    const [lines, setLines] = useState<LyricLine[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Parse LRC format: [00:12.34] Lyric text
    useEffect(() => {
        if (!lrc) {
            setLines([]);
            return;
        }

        const parsedLines: LyricLine[] = lrc
            .split('\n')
            .map(line => {
                const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseFloat(match[2]);
                    return {
                        time: minutes * 60 + seconds,
                        text: match[3].trim()
                    };
                }
                return null;
            })
            .filter((line): line is LyricLine => line !== null)
            .sort((a, b) => a.time - b.time);

        setLines(parsedLines);
    }, [lrc]);

    // Find active line and handle scroll
    useEffect(() => {
        const index = lines.findIndex((line, i) => {
            const nextLine = lines[i + 1];
            return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });

        if (index !== -1 && index !== activeIndex) {
            setActiveIndex(index);
            // Auto-scroll logic: keep active line in center
            if (scrollRef.current) {
                const activeEl = scrollRef.current.children[index] as HTMLElement;
                if (activeEl) {
                    scrollRef.current.scrollTo({
                        top: activeEl.offsetTop - scrollRef.current.offsetHeight / 2 + activeEl.offsetHeight / 2,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }, [currentTime, lines, activeIndex]);

    if (lines.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-brand-muted italic px-10 text-center">
                Lirik tidak tersedia untuk lagu ini.
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            className="relative h-full overflow-y-auto overflow-x-hidden scrollbar-hide py-40 px-8 transition-colors duration-1000"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
            }}
        >
            {lines.map((line, i) => (
                <div
                    key={i}
                    className={`transition-all duration-500 mb-6 font-bold text-2xl md:text-3xl lg:text-4xl leading-tight ${i === activeIndex
                        ? 'scale-110 opacity-100'
                        : 'scale-100 opacity-20'
                        }`}
                    style={{
                        color: i === activeIndex ? themeColor : 'inherit'
                    }}
                >
                    {line.text || '•••'}
                </div>
            ))}
        </div>
    );
}
