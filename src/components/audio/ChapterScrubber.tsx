import React from 'react';

interface ChapterScrubberProps {
  currentTime: number;
  duration: number;
  chapterNumber: number;
  totalChapters: number;
  chapterTitle: string;
  onSeek: (timeSec: number) => void;
}

export const ChapterScrubber: React.FC<ChapterScrubberProps> = ({
  currentTime,
  duration,
  chapterNumber,
  totalChapters,
  chapterTitle,
  onSeek,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  return (
    <div className="w-full flex flex-col space-y-2">
      {/* Chapter Indicator Header */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-400/30 text-cyan-300 font-semibold text-[10px]">
          CH {chapterNumber} OF {totalChapters}
        </span>
        <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
          {chapterTitle}
        </span>
      </div>

      {/* Progress Track & Slider */}
      <div className="relative w-full flex items-center group py-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        />

        {/* Custom Visual Bar */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-slate-800/90 rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        {/* Scrubber Knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,1)] pointer-events-none transition-transform group-hover:scale-125"
          style={{
            left: `calc(${Math.min(100, Math.max(0, progressPercent))}% - 7px)`,
          }}
        />
      </div>

      {/* Timestamp Timecodes */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
      </div>
    </div>
  );
};
