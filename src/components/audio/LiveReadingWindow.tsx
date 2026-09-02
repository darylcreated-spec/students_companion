import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Volume2, AlignLeft, ZoomIn, ZoomOut } from 'lucide-react';

interface LiveReadingWindowProps {
  title: string;
  content: string;
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0 to 1
  currentTime: number;
  duration: number;
}

export const LiveReadingWindow: React.FC<LiveReadingWindowProps> = ({
  title,
  content,
  isPlaying,
  isPaused,
  progress,
  currentTime,
  duration,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Split content into sentences/paragraphs to highlight active reading section
  const sentences = React.useMemo(() => {
    if (!content) return [];
    return content
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [content]);

  const activeIndex = Math.min(
    sentences.length - 1,
    Math.max(0, Math.floor(progress * (sentences.length || 1)))
  );

  // Auto-scroll to active sentence when playing
  useEffect(() => {
    if (isPlaying && !isPaused && containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex, isPlaying, isPaused]);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-xs leading-relaxed';
      case 'lg':
        return 'text-base leading-relaxed';
      case 'md':
      default:
        return 'text-sm leading-relaxed';
    }
  };

  return (
    <div className="w-full rounded-3xl bg-[#0E1426]/90 border border-cyan-400/25 shadow-xl backdrop-blur-xl flex flex-col overflow-hidden transition-all">
      {/* Header bar of Live Reading Window */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-bold text-[11px] uppercase tracking-wider">
            Live Reading Window
          </span>
          {isPlaying && !isPaused && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          )}
        </div>

        {/* Font Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setFontSize('sm')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              fontSize === 'sm'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A-
          </button>
          <button
            onClick={() => setFontSize('md')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              fontSize === 'md'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A
          </button>
          <button
            onClick={() => setFontSize('lg')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              fontSize === 'lg'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A+
          </button>
        </div>
      </div>

      {/* Reading Text Body */}
      <div
        ref={containerRef}
        className={`p-4 max-h-[160px] sm:max-h-[210px] overflow-y-auto overscroll-contain space-y-2.5 font-sora ${getFontSizeClass()}`}
      >
        {sentences.length > 0 ? (
          sentences.map((sentence, idx) => {
            const isCurrent = idx === activeIndex && isPlaying && !isPaused;
            const isRead = idx < activeIndex;

            return (
              <p
                key={idx}
                data-active={isCurrent}
                className={`transition-all duration-300 rounded-lg p-1 ${
                  isCurrent
                    ? 'text-cyan-200 bg-cyan-950/60 border-l-2 border-cyan-400 font-medium shadow-[0_0_15px_rgba(34,211,238,0.15)] pl-2'
                    : isRead
                    ? 'text-slate-400 opacity-80'
                    : 'text-slate-200'
                }`}
              >
                {sentence}
              </p>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 italic">
            {content || 'Audio content text will appear here as it is read.'}
          </p>
        )}
      </div>

      {/* Progress Footer */}
      <div className="px-4 py-1.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>
          {isPlaying && !isPaused ? 'Narrating active section...' : isPaused ? 'Playback Paused' : 'Ready to Read'}
        </span>
        <span className="text-cyan-400 font-semibold">
          {Math.round(progress * 100)}% Complete
        </span>
      </div>
    </div>
  );
};
