import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, SkipBack, SkipForward, Mic, Bookmark } from 'lucide-react';
import { PlaybackRate } from '../../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  playbackRate: PlaybackRate;
  onTogglePlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onRateChange: (rate: PlaybackRate) => void;
  onDropNote: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isPaused,
  playbackRate,
  onTogglePlayPause,
  onSkipBackward,
  onSkipForward,
  onPreviousChapter,
  onNextChapter,
  onRateChange,
  onDropNote,
}) => {
  const rates: PlaybackRate[] = [1.0, 1.25, 1.5, 2.0];
  const activePlaying = isPlaying && !isPaused;

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Playback Rate Selector Pills */}
      <div className="flex items-center space-x-1.5 p-1 rounded-full bg-slate-900/90 border border-white/5">
        {rates.map((r) => {
          const isSelected = playbackRate === r;
          return (
            <button
              key={r}
              onClick={() => onRateChange(r)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
                isSelected
                  ? 'bg-amber-400 text-obsidian-950 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}x
            </button>
          );
        })}
      </div>

      {/* Main Tactile Commute Control Deck */}
      <div className="w-full flex items-center justify-between px-2">
        {/* Previous Chapter */}
        <button
          onClick={onPreviousChapter}
          aria-label="Previous Chapter"
          className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 active:scale-95 transition-all"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* 15s Skip Backward */}
        <button
          onClick={onSkipBackward}
          aria-label="Skip 15 seconds back"
          className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col items-center justify-center text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-95 transition-all relative"
        >
          <RotateCcw className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-mono font-bold leading-none">15s</span>
        </button>

        {/* Massive Center Play / Pause Button (80x80) */}
        <button
          onClick={onTogglePlayPause}
          aria-label={activePlaying ? 'Pause Lecture' : 'Play Lecture'}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${
            activePlaying
              ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_30px_rgba(34,211,238,0.6)] ring-4 ring-cyan-400/30'
              : 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-obsidian-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-105'
          }`}
        >
          {activePlaying ? (
            <Pause className="w-9 h-9 fill-current" />
          ) : (
            <Play className="w-9 h-9 fill-current ml-1" />
          )}
        </button>

        {/* 15s Skip Forward */}
        <button
          onClick={onSkipForward}
          aria-label="Skip 15 seconds forward"
          className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col items-center justify-center text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-95 transition-all relative"
        >
          <RotateCw className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-mono font-bold leading-none">15s</span>
        </button>

        {/* Next Chapter */}
        <button
          onClick={onNextChapter}
          aria-label="Next Chapter"
          className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 active:scale-95 transition-all"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Massive Single-Tap "Drop Note" Commute Bookmark Trigger */}
      <div className="w-full pt-2">
        <button
          onClick={onDropNote}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-400/50 hover:border-amber-400 text-amber-300 flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] active:scale-98 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-obsidian-950 flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.8)] group-hover:scale-110 transition-transform">
            <Mic className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>DROP NOTE / BOOKMARK</span>
              <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-current" />
            </div>
            <p className="text-[10px] text-amber-300/80 font-mono">
              Single-tap voice capture with lecture timestamp
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
