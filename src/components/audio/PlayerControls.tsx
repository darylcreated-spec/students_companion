import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Mic,
  Bookmark,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { PlaybackRate, SleepTimerMode } from '../../types';

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
  onDropNote?: () => void;
  sleepTimerMode?: SleepTimerMode;
  sleepSecondsRemaining?: number | null;
  onSelectSleepTimer?: (mode: SleepTimerMode) => void;
  // Mini-Player mode to maximize e-book reading viewport
  isMini?: boolean;
  onToggleMini?: () => void;
  chapterTitle?: string;
  chapterNumber?: number;
  totalChapters?: number;
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
  sleepTimerMode = 'off',
  sleepSecondsRemaining = null,
  onSelectSleepTimer,
  isMini = false,
  onToggleMini,
  chapterTitle,
  chapterNumber,
  totalChapters,
}) => {
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const rates: PlaybackRate[] = [1.0, 1.25, 1.5, 2.0];
  const activePlaying = isPlaying && !isPaused;

  const formatSleepTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const sleepModes: { mode: SleepTimerMode; label: string }[] = [
    { mode: 'off', label: 'Off' },
    { mode: '15m', label: '15m' },
    { mode: '30m', label: '30m' },
    { mode: '45m', label: '45m' },
    { mode: 'chapter', label: 'Ch End' },
  ];

  // Compact Docked Mini-Player Mode (Reclaims ~140px for the reading window!)
  if (isMini) {
    return (
      <div className="w-full py-1.5 px-3 rounded-2xl bg-[#0E1426]/95 border border-cyan-400/30 backdrop-blur-xl flex items-center justify-between shadow-xl transition-all">
        {/* Left: Play/Pause and Skip buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={onTogglePlayPause}
            aria-label={activePlaying ? 'Pause' : 'Play'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              activePlaying
                ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                : 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-obsidian-950 hover:bg-cyan-300 shadow-sm'
            }`}
          >
            {activePlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onSkipBackward}
            aria-label="Skip 15s back"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 hover:text-white flex items-center justify-center active:scale-95 transition-colors"
            title="Skip 15 seconds back"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onSkipForward}
            aria-label="Skip 15s forward"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 hover:text-white flex items-center justify-center active:scale-95 transition-colors"
            title="Skip 15 seconds forward"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Chapter title & number */}
        <div className="flex-1 min-w-0 px-2.5">
          <p className="text-xs font-bold text-slate-100 truncate">
            {chapterTitle || 'Lecture Audio'}
          </p>
          <p className="text-[10px] font-mono text-slate-400 truncate">
            Ch {chapterNumber || 1}/{totalChapters || 1} • {playbackRate}x {sleepTimerMode !== 'off' ? `• ⏱️ ${sleepSecondsRemaining ? formatSleepTime(sleepSecondsRemaining) : sleepTimerMode}` : ''}
          </p>
        </div>

        {/* Right: Quick Speed cycle and Expand button */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => {
              const curIdx = rates.indexOf(playbackRate);
              const nextRate = rates[(curIdx + 1) % rates.length];
              onRateChange(nextRate);
            }}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-[11px] font-mono font-bold transition-colors"
            title="Tap to cycle playback speed"
          >
            {playbackRate}x
          </button>

          {onToggleMini && (
            <button
              onClick={onToggleMini}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Expand full audio deck"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deck</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full Expanded Player Controls Mode
  return (
    <div className="w-full flex flex-col items-center space-y-3 relative">
      {/* Top Deck: Speed Selector & Sleep Timer & Collapse Trigger */}
      <div className="w-full flex items-center justify-between px-1">
        {/* Playback Rate Selector Pills */}
        <div className="flex items-center space-x-1 p-1 rounded-full bg-slate-900/90 border border-white/5">
          {rates.map((r) => {
            const isSelected = playbackRate === r;
            return (
              <button
                key={r}
                onClick={() => onRateChange(r)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
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

        {/* Right tools: Sleep Timer & Collapse to Mini-Player */}
        <div className="flex items-center space-x-1.5">
          {/* Commute Sleep Timer Trigger */}
          {onSelectSleepTimer && (
            <div className="relative">
              <button
                onClick={() => setShowSleepMenu(!showSleepMenu)}
                aria-label="Commute sleep timer"
                className={`px-3 py-1.5 rounded-full text-xs font-mono flex items-center space-x-1.5 border transition-all active:scale-95 ${
                  sleepTimerMode !== 'off'
                    ? 'bg-cyan-950 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-900/90 border-white/5 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${sleepTimerMode !== 'off' ? 'text-cyan-400 animate-pulse' : ''}`} />
                <span className="font-semibold">
                  {sleepTimerMode !== 'off' && sleepSecondsRemaining !== null
                    ? formatSleepTime(sleepSecondsRemaining)
                    : sleepTimerMode === 'chapter'
                    ? 'Ch End'
                    : 'Sleep'}
                </span>
              </button>

              {/* Quick Sleep Dropdown Menu */}
              {showSleepMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-44 rounded-2xl bg-[#0E1426] border border-cyan-400/30 shadow-2xl p-2 z-40 space-y-1 animate-in fade-in slide-in-from-bottom-2">
                  <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/5">
                    Commute Sleep Timer
                  </div>
                  {sleepModes.map((item) => {
                    const isCur = sleepTimerMode === item.mode;
                    return (
                      <button
                        key={item.mode}
                        onClick={() => {
                          onSelectSleepTimer(item.mode);
                          setShowSleepMenu(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono text-left flex items-center justify-between transition-colors ${
                          isCur
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{item.label === 'Off' ? 'Turn Off' : item.label}</span>
                        {isCur && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Collapse Button */}
          {onToggleMini && (
            <button
              onClick={onToggleMini}
              className="px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 text-xs font-mono flex items-center gap-1 transition-colors"
              title="Collapse to mini-player"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mini</span>
            </button>
          )}
        </div>
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

      {/* Optional "Drop Note" Commute Bookmark Trigger */}
      {onDropNote && (
        <div className="w-full pt-1">
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
      )}
    </div>
  );
};
