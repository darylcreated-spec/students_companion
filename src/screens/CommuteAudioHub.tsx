import React, { useState } from 'react';
import { LectureDocument, LectureSegment, PlaybackRate, AudioPlayerState } from '../types';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { PlayerControls } from '../components/audio/PlayerControls';
import { ChapterScrubber } from '../components/audio/ChapterScrubber';
import { Sparkles, BookOpen, Volume2, ShieldAlert, Headphones } from 'lucide-react';
import { GeminiService } from '../services/ai/geminiService';

interface CommuteAudioHubProps {
  document: LectureDocument | null;
  currentSegment: LectureSegment | null;
  playerState: AudioPlayerState;
  onTogglePlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onRateChange: (rate: PlaybackRate) => void;
  onSeek: (timeSec: number) => void;
  onDropNote: () => void;
  onSwitchToLibrary: () => void;
  onRewriteWithGemini: (segmentIndex: number) => void;
  isRewriting?: boolean;
}

export const CommuteAudioHub: React.FC<CommuteAudioHubProps> = ({
  document,
  currentSegment,
  playerState,
  onTogglePlayPause,
  onSkipBackward,
  onSkipForward,
  onPreviousChapter,
  onNextChapter,
  onRateChange,
  onSeek,
  onDropNote,
  onSwitchToLibrary,
  onRewriteWithGemini,
  isRewriting = false,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!document) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          <Headphones className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          No Lecture in Audio Queue
        </h2>
        <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">
          Ingest a .pptx, .pdf, .docx, or Google Doc to generate your hands-free audio commute journey.
        </p>
        <button
          onClick={onSwitchToLibrary}
          className="px-6 py-3 rounded-2xl bg-cyan-400 text-obsidian-950 font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:brightness-110 active:scale-95 transition-all"
        >
          Open Lecture Library
        </button>
      </div>
    );
  }

  const progress = playerState.duration > 0 ? playerState.currentTime / playerState.duration : 0;
  const totalChapters = document.segments.length;
  const currentChapterNum = playerState.currentSegmentIndex + 1;

  return (
    <div className="flex-1 flex flex-col space-y-4 p-4 pb-6 overflow-y-auto overscroll-contain">
      {/* Top Glass Card: Lecture & Chapter Metadata */}
      <div className="p-4 rounded-3xl bg-[#0E1426]/80 border border-white/10 shadow-lg backdrop-blur-xl flex flex-col space-y-2 relative shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
            Current Lecture
          </span>
          <button
            onClick={() => onRewriteWithGemini(playerState.currentSegmentIndex)}
            disabled={isRewriting}
            className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-slate-900 border border-cyan-400/30 text-[11px] font-mono text-cyan-300 hover:border-cyan-400 transition-colors"
          >
            <Sparkles className={`w-3 h-3 text-cyan-400 ${isRewriting ? 'animate-spin' : ''}`} />
            <span>{isRewriting ? 'Rewriting...' : 'Gemini Radio Polish'}</span>
          </button>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight line-clamp-1">
            {document.title}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
            {currentSegment?.title || `Chapter ${currentChapterNum}`}
          </p>
        </div>

        {/* Quick bullet points pill */}
        {currentSegment?.keyPoints && currentSegment.keyPoints.length > 0 && (
          <div className="pt-2 border-t border-white/5 flex items-start space-x-1.5 text-[11px] text-slate-300">
            <span className="text-cyan-400 font-bold">•</span>
            <span className="line-clamp-1">{currentSegment.keyPoints[0]}</span>
          </div>
        )}
      </div>

      {/* Central Visualizer & Scrubber Deck */}
      <div className="py-2 flex flex-col items-center space-y-3 shrink-0">
        {/* Dynamic Electric Cyan Audio Waveform Progress Bar */}
        <WaveformVisualizer
          isPlaying={playerState.isPlaying && !playerState.isPaused}
          progress={progress}
          audioLevel={playerState.isPlaying && !playerState.isPaused ? 0.6 : 0.05}
          activeColor="#22D3EE"
          inactiveColor="rgba(255, 255, 255, 0.15)"
          height={65}
        />

        {/* Chapter Scrubber Bar */}
        <ChapterScrubber
          currentTime={playerState.currentTime}
          duration={playerState.duration}
          chapterNumber={currentChapterNum}
          totalChapters={totalChapters}
          chapterTitle={currentSegment?.title || ''}
          onSeek={onSeek}
        />
      </div>

      {/* Massive Tactile Commute Player Controls & Single-Tap Drop Note */}
      <div className="pt-1">
        <PlayerControls
          isPlaying={playerState.isPlaying}
          isPaused={playerState.isPaused}
          playbackRate={playerState.playbackRate}
          onTogglePlayPause={onTogglePlayPause}
          onSkipBackward={onSkipBackward}
          onSkipForward={onSkipForward}
          onPreviousChapter={onPreviousChapter}
          onNextChapter={onNextChapter}
          onRateChange={onRateChange}
          onDropNote={onDropNote}
        />
      </div>
    </div>
  );
};
