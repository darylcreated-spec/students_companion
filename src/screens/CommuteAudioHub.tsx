import React, { useState } from 'react';
import { LectureDocument, LectureSegment, PlaybackRate, AudioPlayerState } from '../types';
import { LiveReadingWindow } from '../components/audio/LiveReadingWindow';
import { PlayerControls } from '../components/audio/PlayerControls';
import { ChapterScrubber } from '../components/audio/ChapterScrubber';
import { ChapterPickerModal } from '../components/audio/ChapterPickerModal';
import { Radio, BookOpen, Volume2, ShieldAlert, Headphones, Library, ListOrdered } from 'lucide-react';

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
  onSelectChapter: (chapterIndex: number) => void;
  onSentenceClick: (sentenceIndex: number, totalSentences: number) => void;
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
  onSelectChapter,
  onSentenceClick,
  isRewriting = false,
}) => {
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState(false);

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
          className="px-6 py-3 rounded-2xl bg-cyan-400 text-obsidian-950 font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
        >
          <Library className="w-4 h-4 mr-1.5" />
          <span>Open Lecture Library</span>
        </button>
      </div>
    );
  }

  const progress = playerState.duration > 0 ? playerState.currentTime / playerState.duration : 0;
  const totalChapters = document.segments.length;
  const currentChapterNum = playerState.currentSegmentIndex + 1;

  // Active reading content
  const activeReadingText =
    currentSegment?.synthesizedAudioText ||
    currentSegment?.originalContent ||
    'Preparing reading text...';

  return (
    <div className="flex-1 flex flex-col space-y-2.5 p-3.5 pb-4 overflow-y-auto overscroll-contain">
      {/* Top Glass Card: Lecture & Chapter Metadata + Start Point Selector */}
      <div className="p-3 rounded-2xl bg-[#0E1426]/80 border border-white/10 shadow-lg backdrop-blur-xl flex flex-col space-y-1.5 relative shrink-0">
        <div className="flex items-center justify-between">
          {/* Chapter / Start Point Picker Button */}
          <button
            onClick={() => setIsChapterPickerOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-cyan-400/30 hover:border-cyan-400 text-[11px] font-mono text-cyan-300 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
            <span>Start Point: Ch {currentChapterNum}/{totalChapters}</span>
          </button>

          <button
            onClick={() => onRewriteWithGemini(playerState.currentSegmentIndex)}
            disabled={isRewriting}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-cyan-400/30 text-[11px] font-mono text-cyan-300 hover:border-cyan-400 transition-colors"
          >
            <Radio className={`w-3.5 h-3.5 text-cyan-400 ${isRewriting ? 'animate-pulse text-amber-400' : ''}`} />
            <span>{isRewriting ? 'Enhancing Audio...' : 'Audio Polish'}</span>
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
      </div>

      {/* Live Content Reading Window (With Tap-To-Read From Any Sentence) */}
      <div className="w-full shrink-0">
        <LiveReadingWindow
          title={currentSegment?.title || document.title}
          content={activeReadingText}
          isPlaying={playerState.isPlaying}
          isPaused={playerState.isPaused}
          progress={progress}
          currentTime={playerState.currentTime}
          duration={playerState.duration}
          onSentenceClick={onSentenceClick}
          onOpenChapterPicker={() => setIsChapterPickerOpen(true)}
        />
      </div>

      {/* Chapter Scrubber Bar */}
      <div className="py-1 shrink-0">
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
      <div className="pt-0.5">
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

      {/* Chapter & Start Point Selection Modal */}
      <ChapterPickerModal
        isOpen={isChapterPickerOpen}
        onClose={() => setIsChapterPickerOpen(false)}
        document={document}
        currentChapterIndex={playerState.currentSegmentIndex}
        onSelectChapter={onSelectChapter}
      />
    </div>
  );
};
